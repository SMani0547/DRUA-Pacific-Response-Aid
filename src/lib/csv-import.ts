import type { PriorityReport, Severity } from "./mock-data";

const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];

export interface ImportResult {
  reports: PriorityReport[];
  errors: string[];
}

// Minimal RFC-4180-ish CSV parser: supports quoted fields, escaped quotes ("") and newlines inside quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cur); cur = "";
        if (row.some((f) => f.trim() !== "")) rows.push(row);
        row = [];
      } else cur += c;
    }
  }
  if (cur !== "" || row.length) { row.push(cur); if (row.some((f) => f.trim() !== "")) rows.push(row); }
  return rows;
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[\s_-]+/g, "");
}

const HEADER_ALIASES: Record<string, keyof PriorityReport> = {
  id: "id",
  area: "area",
  location: "area",
  village: "area",
  issue: "issue",
  type: "issue",
  incident: "issue",
  severity: "severity",
  priority: "severity",
  peopleaffected: "peopleAffected",
  people: "peopleAffected",
  population: "peopleAffected",
  affected: "peopleAffected",
  resources: "resources",
  resource: "resources",
  riskscore: "riskScore",
  score: "riskScore",
  risk: "riskScore",
  action: "action",
  recommendation: "action",
};

function coerceSeverity(v: string): Severity | null {
  const t = v.trim().toLowerCase();
  const match = SEVERITIES.find((s) => s.toLowerCase() === t);
  return match ?? null;
}

export function parseReportsCsv(text: string): ImportResult {
  const rows = parseCsv(text.trim());
  const errors: string[] = [];
  if (rows.length < 2) {
    return { reports: [], errors: ["CSV is empty or missing a header row."] };
  }
  const header = rows[0].map((h) => HEADER_ALIASES[normalizeHeader(h)] ?? null);
  const required: (keyof PriorityReport)[] = ["area", "issue", "severity", "peopleAffected"];
  const missing = required.filter((r) => !header.includes(r));
  if (missing.length) {
    return { reports: [], errors: [`Missing required column(s): ${missing.join(", ")}`] };
  }

  const reports: PriorityReport[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const rec: Partial<PriorityReport> = {};
    header.forEach((key, i) => {
      if (!key) return;
      const raw = (cells[i] ?? "").trim();
      if (key === "peopleAffected" || key === "riskScore") {
        const n = Number(raw.replace(/[,\s]/g, ""));
        if (!Number.isFinite(n)) return;
        (rec as Record<string, unknown>)[key] = Math.max(0, Math.round(n));
      } else if (key === "severity") {
        const s = coerceSeverity(raw);
        if (s) rec.severity = s;
      } else {
        (rec as Record<string, unknown>)[key] = raw;
      }
    });

    if (!rec.area || !rec.issue || !rec.severity || rec.peopleAffected == null) {
      errors.push(`Row ${r + 1}: skipped (missing area, issue, severity, or people).`);
      continue;
    }
    reports.push({
      id: rec.id || `imp-${r}-${Date.now().toString(36)}`,
      area: rec.area,
      issue: rec.issue,
      severity: rec.severity,
      peopleAffected: rec.peopleAffected,
      resources: rec.resources || "—",
      riskScore: Math.min(100, Math.max(0, rec.riskScore ?? computeFallbackScore(rec.severity, rec.peopleAffected))),
      action: rec.action || "Review and assign response team",
    });
  }
  return { reports, errors };
}

function computeFallbackScore(sev: Severity, people: number): number {
  const base = sev === "Critical" ? 85 : sev === "High" ? 70 : sev === "Medium" ? 50 : 30;
  const bump = Math.min(15, Math.round(people / 500));
  return base + bump;
}

export const SAMPLE_CSV = `area,issue,severity,peopleAffected,resources,riskScore,action
Rakiraki,Flash Flooding,Critical,3200,"2 boats, 1 medical team",94,Deploy rescue teams immediately
Ba,River Overflow,Critical,2450,"3 boats, evacuation buses",89,Evacuate low-lying settlements
Tavua,Road Closure / Landslide,High,850,1 clearing crew,76,Dispatch clearing crew within 2 hrs
Lautoka,Water Shortage,High,5100,4 water tankers,71,Distribute water to priority zones
Nadi,Health Risk – Dengue Spike,Medium,1200,Mobile clinic,58,Deploy vector control & clinic
`;
