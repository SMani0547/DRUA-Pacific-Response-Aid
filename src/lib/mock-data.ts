export type Severity = "Critical" | "High" | "Medium" | "Low";

export type ReportStatus =
  | "New"
  | "Under Review"
  | "Approved"
  | "Dispatched"
  | "Resolved";

export type Urgency = "Immediate" | "Within 6h" | "Within 24h";
export type RoadAccess = "Open" | "Limited" | "Blocked";
export type ReporterType =
  | "Community"
  | "District Officer"
  | "NGO"
  | "Hospital";

export const REPORT_STATUSES: ReportStatus[] = [
  "New",
  "Under Review",
  "Approved",
  "Dispatched",
  "Resolved",
];

export interface PriorityReport {
  id: string;
  area: string;
  issue: string;
  severity: Severity;
  peopleAffected: number;
  resources: string;
  riskScore: number;
  action: string;
  status?: ReportStatus;
  urgency?: Urgency;
  roadAccess?: RoadAccess;
  description?: string;
  reporterType?: ReporterType;
  previousRiskScore?: number;
  previousSeverity?: Severity;
  updatedAt?: string;
}

export interface RiskInput {
  severity: Severity;
  peopleAffected: number;
  roadAccess?: RoadAccess;
  urgency?: Urgency;
  resources?: string;
}

export function computeRiskScore(input: RiskInput): number {
  const sevBase: Record<Severity, number> = {
    Critical: 78,
    High: 60,
    Medium: 42,
    Low: 22,
  };
  let score = sevBase[input.severity];
  score += Math.min(15, Math.round(input.peopleAffected / 400));
  if (input.roadAccess === "Blocked") score += 6;
  else if (input.roadAccess === "Limited") score += 3;
  if (input.urgency === "Immediate") score += 6;
  else if (input.urgency === "Within 6h") score += 3;
  const res = (input.resources ?? "").toLowerCase();
  if (!res || res === "—" || res.includes("none")) score += 4;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export const priorityReports: PriorityReport[] = [
  {
    id: "1",
    area: "Rakiraki",
    issue: "Flash Flooding",
    severity: "Critical",
    peopleAffected: 3200,
    resources: "2 boats, 1 medical team",
    riskScore: 94,
    action: "Deploy rescue teams immediately",
    status: "Under Review",
    urgency: "Immediate",
    roadAccess: "Blocked",
    reporterType: "District Officer",
    previousRiskScore: 87,
    previousSeverity: "High",
    updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    area: "Ba",
    issue: "River Overflow",
    severity: "Critical",
    peopleAffected: 2450,
    resources: "3 boats, evacuation buses",
    riskScore: 89,
    action: "Evacuate low-lying settlements",
    status: "Approved",
    urgency: "Immediate",
    roadAccess: "Limited",
    reporterType: "District Officer",
    previousRiskScore: 82,
    previousSeverity: "Critical",
    updatedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    area: "Tavua",
    issue: "Road Closure / Landslide",
    severity: "High",
    peopleAffected: 850,
    resources: "1 clearing crew",
    riskScore: 76,
    action: "Dispatch clearing crew within 2 hrs",
    status: "Dispatched",
    urgency: "Within 6h",
    roadAccess: "Blocked",
    reporterType: "NGO",
    previousRiskScore: 71,
    previousSeverity: "High",
    updatedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    area: "Lautoka",
    issue: "Water Shortage",
    severity: "High",
    peopleAffected: 5100,
    resources: "4 water tankers",
    riskScore: 71,
    action: "Distribute water to priority zones",
    status: "New",
    urgency: "Within 6h",
    roadAccess: "Open",
    reporterType: "Community",
    previousRiskScore: 71,
    previousSeverity: "High",
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    area: "Nadi",
    issue: "Health Risk – Dengue Spike",
    severity: "Medium",
    peopleAffected: 1200,
    resources: "Mobile clinic",
    riskScore: 58,
    action: "Deploy vector control & clinic",
    status: "Under Review",
    urgency: "Within 24h",
    roadAccess: "Open",
    reporterType: "Hospital",
    previousRiskScore: 64,
    previousSeverity: "High",
    updatedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: "6",
    area: "Labasa",
    issue: "Power Outage",
    severity: "Medium",
    peopleAffected: 980,
    resources: "Utility crew",
    riskScore: 47,
    action: "Restore priority feeder lines",
    status: "Dispatched",
    urgency: "Within 6h",
    roadAccess: "Open",
    reporterType: "Community",
    previousRiskScore: 47,
    previousSeverity: "Medium",
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "7",
    area: "Suva",
    issue: "Localized Flooding",
    severity: "Low",
    peopleAffected: 320,
    resources: "Municipal team",
    riskScore: 32,
    action: "Monitor and drain hotspots",
    status: "Resolved",
    urgency: "Within 24h",
    roadAccess: "Open",
    reporterType: "Community",
    previousRiskScore: 41,
    previousSeverity: "Medium",
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
];

export const overviewStats = [
  { label: "Total Reports Today", value: "148", trend: "+12%", hint: "vs. yesterday" },
  { label: "High Risk Areas", value: "6", trend: "+2", hint: "critical + high" },
  { label: "People Affected", value: "14.1K", trend: "+3.4K", hint: "since 6am" },
  { label: "Available Response Teams", value: "22", trend: "-4", hint: "deployed now" },
  { label: "Estimated Time Saved", value: "37 min", trend: "+8%", hint: "avg per incident" },
];

export const riskTrend = [
  { time: "00:00", reports: 8, risk: 22 },
  { time: "03:00", reports: 12, risk: 30 },
  { time: "06:00", reports: 24, risk: 45 },
  { time: "09:00", reports: 41, risk: 62 },
  { time: "12:00", reports: 58, risk: 74 },
  { time: "15:00", reports: 72, risk: 81 },
  { time: "18:00", reports: 89, risk: 88 },
];

export const affectedByArea = [
  { area: "Rakiraki", people: 3200 },
  { area: "Ba", people: 2450 },
  { area: "Lautoka", people: 5100 },
  { area: "Nadi", people: 1200 },
  { area: "Labasa", people: 980 },
  { area: "Tavua", people: 850 },
  { area: "Suva", people: 320 },
];

export const aiSummary = `Priority focus: Rakiraki and Ba are the highest-risk areas in the current 6-hour window. Rakiraki shows a 94/100 AI risk score driven by flash flooding along the Penang River and 3,200 residents in low-lying settlements with limited road access. Ba follows at 89/100 with river overflow already breaching two evacuation thresholds.

Recommended sequence: (1) Deploy rescue boats and a medical team to Rakiraki within 30 minutes, (2) begin coordinated evacuation of Ba's Nailaga and Yalalevu settlements, (3) pre-position water tankers for Lautoka before the shortage escalates.

Signals used: rainfall telemetry, community SMS reports, road-closure feeds, and hospital capacity. Confidence: High.`;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const chatSuggestions = [
  "Which area needs help first?",
  "Summarize the top 3 risks.",
  "What resources should we send?",
  "Show flood-related reports.",
];

export function getMockAssistantReply(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("first") || q.includes("priorit")) {
    return "Rakiraki should be prioritized first. AI risk score 94/100 — flash flooding, 3,200 residents affected, limited road access. Deploy rescue boats and medical support within 30 minutes.";
  }
  if (q.includes("top 3") || q.includes("summarize")) {
    return "Top 3 risks right now:\n1. Rakiraki — flash flooding, 3,200 affected (Critical)\n2. Ba — river overflow, 2,450 affected (Critical)\n3. Lautoka — water shortage escalating, 5,100 affected (High)";
  }
  if (q.includes("resource")) {
    return "Recommended dispatch: 5 rescue boats, 2 medical teams, 4 water tankers, and 3 evacuation buses. Reserve 1 clearing crew for the Tavua landslide.";
  }
  if (q.includes("flood")) {
    return "Flood-related reports: Rakiraki (Critical), Ba (Critical), Suva (Low). Combined 5,970 people affected. Rainfall is forecast to continue for the next 6 hours.";
  }
  return "I've analyzed the latest community reports. The highest-priority area is Rakiraki, followed by Ba. Ask about resources, top risks, or a specific area for more detail.";
}

export function generateActionPlan(r: PriorityReport): {
  step: string;
  eta: string;
}[] {
  const plan: { step: string; eta: string }[] = [];
  const people = r.peopleAffected.toLocaleString();
  const critical = r.severity === "Critical" || r.severity === "High";

  if (r.roadAccess === "Blocked") {
    plan.push({
      step: `Deploy road-clearing crew to restore access to ${r.area}.`,
      eta: "0–30 min",
    });
  }
  plan.push({
    step: critical
      ? `Dispatch primary response team with ${r.resources} to ${r.area}.`
      : `Assign a response lead and mobilize ${r.resources} to ${r.area}.`,
    eta: r.urgency === "Immediate" ? "0–30 min" : r.urgency === "Within 6h" ? "0–2 hrs" : "2–6 hrs",
  });
  if (r.peopleAffected >= 1000) {
    plan.push({
      step: `Set up triage and shelter point for ~${people} affected residents.`,
      eta: "30–90 min",
    });
  }
  if (r.issue.toLowerCase().includes("flood") || r.issue.toLowerCase().includes("water")) {
    plan.push({
      step: "Pre-position water tankers and coordinate with WAF/Ministry of Health.",
      eta: "1–3 hrs",
    });
  }
  if (r.issue.toLowerCase().includes("health") || r.issue.toLowerCase().includes("dengue")) {
    plan.push({
      step: "Activate mobile clinic and vector-control sweep in the affected zone.",
      eta: "1–4 hrs",
    });
  }
  plan.push({
    step: "Report status back to EOC and reassess risk at the next 30-min cycle.",
    eta: "Ongoing",
  });
  return plan.slice(0, 5);
}
