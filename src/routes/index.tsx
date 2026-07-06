import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Bot,
  Clock,
  Cloud,
  Database,
  Filter,
  Gauge,
  Github,
  MessageSquare,
  Send,
  Shield,
  Sparkles,
  Table2,
  Timer,
  TrendingUp,
  Users,
  Waves,
  X,
  Zap,
  Download,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { exportPriorityPdf } from "@/lib/export-pdf";
import { parseReportsCsv, SAMPLE_CSV } from "@/lib/csv-import";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import rapidsBenchmarkProof from "@/assets/rapids-benchmark-proof.png.asset.json";
import bqSchema from "@/assets/bq-schema.png.asset.json";
import bqTop10 from "@/assets/bq-top10-query.png.asset.json";
import bqAreaRollup from "@/assets/bq-area-rollup.png.asset.json";
import bqIssueRollup from "@/assets/bq-issue-rollup.png.asset.json";
import priLogo from "@/assets/pri-logo.png.asset.json";
import heroTapaPattern from "@/assets/hero-tapa-pattern.png.asset.json";

import { cn } from "@/lib/utils";
import {
  MapPin,
  Radio,
  ShieldCheck,
  Truck,
  UserCog,
} from "lucide-react";
import {
  aiSummary,
  chatSuggestions,
  getMockAssistantReply,
  overviewStats,
  priorityReports,
  riskTrend,
  type ChatMessage,
  type PriorityReport,
  type Severity,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const severityStyles: Record<Severity, string> = {
  Critical: "bg-destructive/10 text-destructive border-destructive/30",
  High: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  Medium: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  Low: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
};

function Dashboard() {
  const [reports, setReports] = useState<PriorityReport[]>(priorityReports);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const selected = reports.find((r) => r.id === selectedId) ?? null;

  const affectedData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reports) map.set(r.area, (map.get(r.area) ?? 0) + r.peopleAffected);
    return Array.from(map, ([area, people]) => ({ area, people }))
      .sort((a, b) => b.people - a.people)
      .slice(0, 8);
  }, [reports]);

  const overview = useMemo(() => {
    const total = reports.length;
    const highRisk = reports.filter((r) => r.severity === "Critical" || r.severity === "High").length;
    const people = reports.reduce((s, r) => s + r.peopleAffected, 0);
    const fmtPeople = people >= 1000 ? `${(people / 1000).toFixed(1)}K` : String(people);
    return [
      { ...overviewStats[0], value: String(total) },
      { ...overviewStats[1], value: String(highRisk) },
      { ...overviewStats[2], value: fmtPeople },
      overviewStats[3],
      overviewStats[4],
    ];
  }, [reports]);

  function handleImport(text: string, fileName: string) {
    const { reports: parsed, errors } = parseReportsCsv(text);
    if (parsed.length === 0) {
      setImportNotice({
        kind: "error",
        text: errors[0] ?? "Could not parse any rows from the CSV.",
      });
      return;
    }
    setReports(parsed);
    setSelectedId(null);
    setImportNotice({
      kind: "success",
      text: `Imported ${parsed.length} report${parsed.length === 1 ? "" : "s"} from ${fileName}${
        errors.length ? ` · ${errors.length} row${errors.length === 1 ? "" : "s"} skipped` : ""
      }.`,
    });
  }

  function resetReports() {
    setReports(priorityReports);
    setSelectedId(null);
    setImportNotice({ kind: "success", text: "Restored the default sample dataset." });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <main id="dashboard" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        <ImportBar
          onImport={handleImport}
          onReset={resetReports}
          notice={importNotice}
          onDismiss={() => setImportNotice(null)}
          count={reports.length}
        />
        <OverviewCards stats={overview} />
        <div className="grid gap-6 lg:grid-cols-3">
          <TrendChart />
          <AffectedChart data={affectedData} />
        </div>
        <PriorityTable reports={reports} onSelect={setSelectedId} selectedId={selectedId} />
        <div className="grid gap-6 lg:grid-cols-5">
          <AiSummaryCard reports={reports} />
          <ChatPanel />
        </div>
        <GoogleCloudSection />
        <AccelerationSection />
        <PipelineSection />
        <AgentToolsSection />
      </main>
      <Footer />
      <AreaDetailsSheet
        report={selected}
        open={selected !== null}
        onOpenChange={(o) => !o && setSelectedId(null)}
      />
    </div>
  );
}

function ImportBar({
  onImport,
  onReset,
  notice,
  onDismiss,
  count,
}: {
  onImport: (text: string, fileName: string) => void;
  onReset: () => void;
  notice: { kind: "success" | "error"; text: string } | null;
  onDismiss: () => void;
  count: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile() {
    inputRef.current?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onImport("", file.name); // will show error via empty parse
      return;
    }
    const text = await file.text();
    onImport(text, file.name);
  }

  function loadSample() {
    onImport(SAMPLE_CSV, "sample-reports.csv");
  }

  return (
    <section>
      <Card className="rounded-2xl border-border/70 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Import community reports (CSV)</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Columns:{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                  area, issue, severity, peopleAffected, resources, riskScore, action
                </code>
                . Currently displaying {count} report{count === 1 ? "" : "s"}.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              className="hidden"
            />
            <Button variant="outline" size="sm" onClick={loadSample} className="rounded-lg">
              Load sample
            </Button>
            <Button variant="outline" size="sm" onClick={onReset} className="rounded-lg">
              Reset
            </Button>
            <Button size="sm" onClick={pickFile} className="rounded-lg">
              <Upload className="mr-1.5 h-4 w-4" />
              Import CSV
            </Button>
          </div>
        </div>
        {notice && (
          <div
            className={cn(
              "mt-4 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs",
              notice.kind === "success"
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700"
                : "border-destructive/30 bg-destructive/5 text-destructive",
            )}
          >
            {notice.kind === "success" ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            <div className="flex-1">{notice.text}</div>
            <button
              onClick={onDismiss}
              className="text-current/70 hover:text-current"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </Card>
    </section>
  );
}


function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img
            src={priLogo.url}
            alt="Pacific Response Intelligence logo"
            className="h-11 w-11 rounded-xl object-cover shadow-sm ring-1 ring-border/60"
          />
          <div>
            <div className="text-sm font-semibold leading-tight">Pacific Response</div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Intelligence</div>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#dashboard" className="hover:text-foreground">Dashboard</a>
          <a href="#priority" className="hover:text-foreground">Priorities</a>
          <a href="#ai" className="hover:text-foreground">AI Insights</a>
          <a href="#data-layer" className="hover:text-foreground">Data Layer</a>
          <a href="#acceleration" className="hover:text-foreground">Acceleration</a>
        </nav>
        <Button asChild size="sm">
          <a href="#dashboard">Open Dashboard</a>
        </Button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-slate-200">
      <div
        aria-hidden
        className="absolute inset-0 -z-20 opacity-[0.5]"
        style={{
          backgroundImage: `url(${heroTapaPattern.url})`,
          backgroundRepeat: "repeat",
          backgroundSize: "400px auto",
          backgroundPosition: "center top",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 600px at 80% -10%, oklch(0.72 0.14 210 / 0.2), transparent), radial-gradient(800px 400px at 10% 10%, oklch(0.35 0.14 255 / 0.15), transparent)",
        }}
      />
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Powered by Gemini AI + NVIDIA RAPIDS
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Pacific Response <span className="text-primary">Intelligence</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground sm:text-xl">
            AI and accelerated data intelligence for faster community emergency decisions across Fiji and the Pacific.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-xl">
              <a href="#dashboard">
                View Response Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl">
              <a href="#ai">See AI Insights</a>
            </Button>
          </div>
          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-6 text-sm">
            {[
              { icon: Shield, label: "7 districts monitored" },
              { icon: Activity, label: "Real-time community signals" },
              { icon: Gauge, label: "5.2x faster decisions" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4 text-primary" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const statIcons = [Activity, AlertTriangle, Users, Shield, Clock];

function OverviewCards({ stats }: { stats: typeof overviewStats }) {
  return (
    <section>
      <SectionTitle
        eyebrow="Live overview"
        title="Situation at a glance"
        subtitle="Aggregated across all monitored districts in the last 24 hours."
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat, i) => {
          const Icon = statIcons[i];
          return (
            <Card
              key={stat.label}
              className="rounded-2xl border-border/70 p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight">{stat.value}</div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="font-medium text-primary">{stat.trend}</span>
                <span className="text-muted-foreground">{stat.hint}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function TrendChart() {
  return (
    <Card className="lg:col-span-2 rounded-2xl border-border/70 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Today</div>
          <h3 className="mt-1 text-lg font-semibold">Reports & risk trend</h3>
        </div>
        <Badge variant="outline" className="rounded-full">Live</Badge>
      </div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={riskTrend} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.35 0.14 255)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="oklch(0.35 0.14 255)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.72 0.14 210)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="oklch(0.72 0.14 210)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 240)" />
            <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "oklch(0.5 0.03 250)" }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "oklch(0.5 0.03 250)" }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.015 240)", fontSize: 12 }}
            />
            <Area type="monotone" dataKey="reports" stroke="oklch(0.35 0.14 255)" fill="url(#g1)" strokeWidth={2} />
            <Area type="monotone" dataKey="risk" stroke="oklch(0.72 0.14 210)" fill="url(#g2)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function AffectedChart({ data }: { data: { area: string; people: number }[] }) {
  return (
    <Card className="rounded-2xl border-border/70 p-6 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">By area</div>
      <h3 className="mt-1 text-lg font-semibold">People affected</h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 240)" vertical={false} />
            <XAxis dataKey="area" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "oklch(0.5 0.03 250)" }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "oklch(0.5 0.03 250)" }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.015 240)", fontSize: 12 }} />
            <Bar dataKey="people" fill="oklch(0.35 0.14 255)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function PriorityTable({
  reports,
  onSelect,
  selectedId,
}: {
  reports: PriorityReport[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  const [issueFilter, setIssueFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");

  const issueTypes = useMemo(
    () => Array.from(new Set(reports.map((r) => r.issue))).sort(),
    [reports],
  );

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const issueMatch = issueFilter === "all" || r.issue === issueFilter;
      const severityMatch = severityFilter === "all" || r.severity === severityFilter;
      return issueMatch && severityMatch;
    });
  }, [issueFilter, severityFilter]);

  const activeFilters = (issueFilter !== "all" ? 1 : 0) + (severityFilter !== "all" ? 1 : 0);

  return (
    <section id="priority">
      <SectionTitle
        eyebrow="Priority queue"
        title="Recommended response order"
        subtitle="Ranked by AI risk score combining severity, population, and available resources. Select a row for details."
      />
      <Card className="mt-6 overflow-hidden rounded-2xl border-border/70 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border/70 bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filter reports
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={issueFilter} onValueChange={setIssueFilter}>
              <SelectTrigger className="w-full sm:w-52" aria-label="Filter by issue type">
                <SelectValue placeholder="Issue type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All issue types</SelectItem>
                {issueTypes.map((issue) => (
                  <SelectItem key={issue} value={issue}>
                    {issue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as Severity | "all")}>
              <SelectTrigger className="w-full sm:w-44" aria-label="Filter by severity">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            {activeFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIssueFilter("all");
                  setSeverityFilter("all");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="mr-1 h-4 w-4" />
                Clear {activeFilters}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportPriorityPdf(filteredReports, {
                  issueFilter,
                  severityFilter,
                })
              }
              disabled={filteredReports.length === 0}
              className="rounded-lg"
            >
              <Download className="mr-1.5 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Area</th>
                <th className="px-5 py-3">Issue</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">People</th>
                <th className="px-5 py-3">Resources</th>
                <th className="px-5 py-3">AI Score</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3 sr-only">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                    No reports match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => onSelect(r.id)}
                    className={cn(
                      "cursor-pointer transition hover:bg-muted/40",
                      selectedId === r.id && "bg-primary/5",
                    )}
                  >
                    <td className="px-5 py-4 font-medium">{r.area}</td>
                    <td className="px-5 py-4 text-muted-foreground">{r.issue}</td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          severityStyles[r.severity],
                        )}
                      >
                        {r.severity}
                      </span>
                    </td>
                    <td className="px-5 py-4 tabular-nums">{r.peopleAffected.toLocaleString()}</td>
                    <td className="px-5 py-4 text-muted-foreground">{r.resources}</td>
                    <td className="px-5 py-4">
                      <RiskScore score={r.riskScore} />
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{r.action}</td>
                    <td className="px-5 py-4 text-right">
                      <ArrowRight className="inline h-4 w-4 text-muted-foreground" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border/70 px-5 py-3 text-xs text-muted-foreground">
          Showing {filteredReports.length} of {reports.length} reports
          {activeFilters > 0 && (
            <span className="ml-2 text-primary">{activeFilters} filter{activeFilters === 1 ? "" : "s"} active</span>
          )}
        </div>
      </Card>
    </section>
  );
}

function AreaDetailsSheet({
  report,
  open,
  onOpenChange,
}: {
  report: PriorityReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!report) return null;
  const resources = report.resources.split(",").map((r) => r.trim()).filter(Boolean);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                severityStyles[report.severity],
              )}
            >
              {report.severity}
            </span>
            <Badge variant="outline" className="rounded-full text-xs">
              AI score {report.riskScore}
            </Badge>
          </div>
          <SheetTitle className="text-2xl">{report.area}</SheetTitle>
          <SheetDescription className="flex items-center gap-1.5 text-sm">
            <MapPin className="h-3.5 w-3.5" />
            {report.issue}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Incident overview
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <StatTile
                icon={Users}
                label="People affected"
                value={report.peopleAffected.toLocaleString()}
              />
              <StatTile
                icon={Gauge}
                label="AI risk score"
                value={`${report.riskScore}/100`}
              />
              <StatTile icon={AlertTriangle} label="Severity" value={report.severity} />
              <StatTile icon={Radio} label="Status" value="Active" />
            </div>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Available resources
            </div>
            <ul className="mt-3 space-y-2">
              {resources.map((r) => (
                <li
                  key={r}
                  className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 text-sm"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Truck className="h-4 w-4" />
                  </div>
                  <span className="capitalize">{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recommended action
            </div>
            <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{report.action}</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Generated by Gemini AI using rainfall telemetry, community reports, and hospital
                    capacity signals.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1 rounded-xl">
              <Truck className="mr-2 h-4 w-4" /> Dispatch team
            </Button>
            <Button variant="outline" className="flex-1 rounded-xl">
              <UserCog className="mr-2 h-4 w-4" /> Assign lead
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function RiskScore({ score }: { score: number }) {
  const color =
    score >= 85 ? "oklch(0.6 0.22 25)" : score >= 65 ? "oklch(0.7 0.18 60)" : "oklch(0.55 0.15 250)";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="tabular-nums text-xs font-semibold" style={{ color }}>{score}</span>
    </div>
  );
}

function AiSummaryCard({ reports }: { reports: PriorityReport[] }) {
  const [summary, setSummary] = useState<string>(aiSummary);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"mock" | "gemini" | "fallback">("mock");
  const [topArea, setTopArea] = useState<string | null>(null);

  const stamp = generatedAt
    ? `Updated ${new Date(generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Sample summary";

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const top5 = [...reports]
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 5)
        .map((r) => ({
          area: r.area,
          issue_type: r.issue,
          severity: r.severity,
          people_affected: r.peopleAffected,
          resource_status: r.resources,
          road_access: "Unknown",
          risk_score: r.riskScore,
          recommended_action: "",
        }));

      const res = await fetch("/api/gemini-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidents: top5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);

      setSummary(data.summary);
      setTopArea(data.top_area ?? null);
      setGeneratedAt(new Date());
      setSource(data.generated_by === "Gemini" ? "gemini" : "fallback");
      if (data.warning) setError(data.warning);
    } catch (err) {
      const top = [...reports].sort((a, b) => b.riskScore - a.riskScore)[0];
      if (top) {
        setSummary(
          `Priority focus: ${top.area}. A ${top.severity.toLowerCase()} ${top.issue.toLowerCase()} ` +
            `is affecting approximately ${top.peopleAffected.toLocaleString()} people (risk score ${top.riskScore}). ` +
            `Current resources: ${top.resources}. Dispatch a response team immediately and reassess within the next operational cycle.`,
        );
        setTopArea(top.area);
        setSource("fallback");
        setGeneratedAt(new Date());
      }
      setError(err instanceof Error ? err.message : "Failed to generate summary.");
    } finally {
      setLoading(false);
    }
  }

  const badgeLabel =
    source === "gemini" ? "Generated by Gemini" : source === "fallback" ? "Local fallback" : "Sample";

  return (
    <Card id="ai" className="lg:col-span-3 rounded-2xl border-border/70 p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">AI insight</div>
          <h3 className="text-lg font-semibold">Gemini AI Response Summary</h3>
        </div>
        <Badge variant="outline" className="ml-auto rounded-full">
          {stamp}
        </Badge>
      </div>
      {topArea && (
        <div className="mt-3 text-xs text-muted-foreground">
          Top priority area: <span className="font-semibold text-foreground">{topArea}</span>
        </div>
      )}
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-foreground/90">
        {loading ? (
          <p className="text-muted-foreground">Generating Gemini response summary…</p>
        ) : (
          summary.split("\n\n").map((para, i) => <p key={i}>{para}</p>)
        )}
      </div>
      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={generate} disabled={loading} className="rounded-xl">
          <Sparkles className="h-4 w-4" />
          {loading ? "Generating…" : "Generate Gemini Summary"}
        </Button>
        <Badge
          variant={source === "gemini" ? "default" : "secondary"}
          className="rounded-full text-[10px]"
        >
          {badgeLabel}
        </Badge>
        <Badge variant="outline" className="rounded-full text-[10px]">
          Server-side · /api/gemini-summary
        </Badge>
      </div>
    </Card>
  );
}

function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi, I'm the Pacific Response assistant. Ask about priorities, risks, or resources.",
    },
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function send(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setMessages((m) => [...m, { role: "user", content: clean }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", content: getMockAssistantReply(clean) }]);
    }, 350);
  }

  return (
    <Card className="lg:col-span-2 flex flex-col rounded-2xl border-border/70 p-0 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/60 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <MessageSquare className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold">AI Assistant</div>
          <div className="text-xs text-muted-foreground">Mock responses · demo mode</div>
        </div>
      </div>
      <div ref={listRef} className="max-h-80 flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60 px-5 py-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {chatSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about priorities, risks, or resources…"
            className="rounded-xl"
          />
          <Button type="submit" size="icon" className="rounded-xl">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}

function AccelerationSection() {
  const pandas = 1.4007;
  const rapids = 0.1228;
  const speedup = 11.4;
  const datasetSize = 2_000_000;
  return (
    <section id="acceleration">
      <SectionTitle
        eyebrow="Performance · Benchmark evidence"
        title="NVIDIA RAPIDS Acceleration"
        subtitle="GPU-accelerated priority risk-scoring lets response teams process massive incident datasets in a fraction of the time — quicker triage, quicker decisions."
      />

      <Card className="mt-6 overflow-hidden rounded-2xl border-border/70 shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
          {/* Headline */}
          <div className="relative border-b border-border/70 bg-gradient-to-br from-primary/10 via-background to-background p-8 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
              <Zap className="h-3.5 w-3.5" /> Benchmark result
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-6xl font-semibold tracking-tight text-primary sm:text-7xl">
                {speedup.toFixed(2)}x
              </span>
              <span className="text-lg text-muted-foreground">faster</span>
            </div>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Priority risk-scoring and incident ranking on{" "}
              <span className="font-semibold text-foreground">
                {datasetSize.toLocaleString()} emergency reports
              </span>{" "}
              — NVIDIA RAPIDS/cuDF on a Tesla T4 GPU vs traditional pandas on CPU.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                <Database className="mr-1 h-3 w-3" /> 2M rows
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                <Gauge className="mr-1 h-3 w-3" /> NVIDIA Tesla T4
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                <Sparkles className="mr-1 h-3 w-3" /> cuDF
              </Badge>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-6 rounded-xl">
                  <FileText className="h-4 w-4" /> View benchmark evidence
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Benchmark evidence</DialogTitle>
                  <DialogDescription>
                    Raw output from the priority risk-scoring benchmark on 2,000,000 emergency reports.
                  </DialogDescription>
                </DialogHeader>
                <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/40 p-3">
                  <img
                    src={rapidsBenchmarkProof.url}
                    alt="NVIDIA RAPIDS cuDF benchmark result showing 11.4x speedup over pandas"
                    className="w-full rounded-md"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-border/70 p-3">
                    <div className="text-muted-foreground">pandas (CPU)</div>
                    <div className="mt-1 font-mono text-sm font-semibold">{pandas.toFixed(4)}s</div>
                  </div>
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <div className="text-primary">RAPIDS / cuDF (GPU)</div>
                    <div className="mt-1 font-mono text-sm font-semibold text-primary">
                      {rapids.toFixed(4)}s
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Side-by-side comparison */}
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <BenchmarkCard
              label="Traditional pandas"
              value={`${pandas.toFixed(4)}s`}
              icon={Timer}
              barWidth={100}
              tone="muted"
              description="CPU dataframe processing on 2M reports."
            />
            <BenchmarkCard
              label="NVIDIA RAPIDS / cuDF"
              value={`${rapids.toFixed(4)}s`}
              icon={Zap}
              barWidth={(rapids / pandas) * 100}
              tone="primary"
              description="GPU-accelerated processing on Tesla T4."
            />
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 sm:col-span-2">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="min-w-0 text-sm text-muted-foreground">
                  Benchmark uses the same priority risk-scoring and incident-ranking logic as the
                  dashboard. RAPIDS/cuDF acceleration helps emergency teams process large incident
                  datasets faster and make quicker response decisions when conditions change by the
                  minute.
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}


function BenchmarkCard({
  label,
  value,
  icon: Icon,
  barWidth,
  tone,
  description,
}: {
  label: string;
  value: string;
  icon: typeof Timer;
  barWidth: number;
  tone: "muted" | "primary";
  description: string;
}) {
  return (
    <Card className="rounded-2xl border-border/70 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            tone === "primary" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-4xl font-semibold tracking-tight">{value}</div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", tone === "primary" ? "bg-primary" : "bg-muted-foreground/40")}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{description}</p>
    </Card>
  );
}

const gcpStack = [
  {
    icon: Cloud,
    name: "Cloud Storage",
    role: "Ingest",
    detail: "Uploaded community incident CSV files land in a Cloud Storage bucket before ETL.",
    meta: "gs://pacific-response/incidents/",
  },
  {
    icon: Database,
    name: "BigQuery",
    role: "Store & query",
    detail: "Emergency reports are loaded into a partitioned BigQuery table for fast SQL analytics.",
    meta: "pacific_response_intelligence.incident_reports",
  },
  {
    icon: Zap,
    name: "NVIDIA RAPIDS / cuDF",
    role: "Accelerate",
    detail: "GPU-accelerated priority risk scoring on millions of rows — 11.4× faster than pandas.",
    meta: "Tesla T4 · cuDF pipeline",
  },
  {
    icon: Sparkles,
    name: "Gemini",
    role: "Summarize",
    detail: "Generates plain-language response summaries and recommended next actions.",
    meta: "gemini-1.5 · grounded on BigQuery",
  },
  {
    icon: Boxes,
    name: "Response Dashboard",
    role: "Decide",
    detail: "Ranked priorities, resources, and AI insight in a single decision-support view.",
    meta: "This app",
  },
];

const gcpProofShots = [
  {
    src: bqSchema.url,
    title: "BigQuery table schema",
    caption: "pacific_response_intelligence.incident_reports — 15 columns including risk_score, severity, people_affected.",
  },
  {
    src: bqTop10.url,
    title: "Top 10 highest-risk incidents",
    caption: "SELECT … FROM incident_reports ORDER BY risk_score DESC LIMIT 10 — the ranked priority list served to responders.",
  },
  {
    src: bqAreaRollup.url,
    title: "Roll-up by area",
    caption: "Aggregate reports, avg / max risk, and total people affected per area.",
  },
  {
    src: bqIssueRollup.url,
    title: "Roll-up by issue type",
    caption: "Distribution across Flooding, Cyclone Damage, Health Risk, Power Outage, Road Blocked, Water Shortage.",
  },
];

function GoogleCloudSection() {
  return (
    <section id="data-layer">
      <SectionTitle
        eyebrow="Architecture · Google Cloud"
        title="Google Cloud Data Layer"
        subtitle="How raw community reports become ranked, AI-summarised decisions — powered by Cloud Storage, BigQuery, NVIDIA RAPIDS and Gemini."
      />

      {/* Stack cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {gcpStack.map((s) => (
          <Card key={s.name} className="rounded-2xl border-border/70 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-4.5 w-4.5" />
              </div>
              <Badge variant="secondary" className="rounded-full text-[10px] uppercase tracking-wide">
                {s.role}
              </Badge>
            </div>
            <div className="mt-3 text-sm font-semibold">{s.name}</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.detail}</p>
            <div className="mt-3 truncate rounded-md bg-muted/60 px-2 py-1 font-mono text-[10.5px] text-muted-foreground">
              {s.meta}
            </div>
          </Card>
        ))}
      </div>

      {/* Pipeline flow */}
      <Card className="mt-4 rounded-2xl border-border/70 bg-gradient-to-br from-primary/5 via-background to-background p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
          <ArrowRight className="h-3.5 w-3.5" /> Data flow
        </div>
        <div className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-center">
          {[
            "Community Reports / CSV",
            "Cloud Storage",
            "BigQuery incident_reports",
            "Risk Scoring + RAPIDS",
            "Gemini Summary",
            "Response Dashboard",
          ].map((step, i, arr) => (
            <div key={step} className="flex flex-1 items-center gap-2 lg:flex-col">
              <div className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-center text-xs font-medium">
                {step}
              </div>
              {i < arr.length - 1 && (
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground lg:rotate-0" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* BigQuery proof card */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <Card className="rounded-2xl border-border/70 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Table2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold">BigQuery proof</div>
                <Badge variant="secondary" className="rounded-full text-[10px]">Live dataset</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Real BigQuery objects backing the dashboard — table, rows, and a working query.
              </p>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <ProofRow k="Dataset" v="pacific_response_intelligence" mono />
            <ProofRow k="Table" v="incident_reports" mono />
            <ProofRow k="Example rows" v="10,000 emergency reports" />
            <ProofRow k="Example query" v="Top 10 highest-risk incidents by risk_score" />
            <div className="sm:col-span-2">
              <ProofRow k="Output" v="Ranked priority list for response teams" />
            </div>
          </dl>

          <div className="mt-5 overflow-hidden rounded-xl border border-border/70 bg-slate-950 text-slate-100">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[11px] text-slate-400">
              <span className="font-mono">bq · Standard SQL</span>
              <span>10K rows · 1.4 MB</span>
            </div>
            <pre className="overflow-x-auto p-4 text-[11.5px] leading-relaxed">
{`SELECT
  area, issue_type, severity, people_affected,
  resource_status, road_access, risk_score,
  recommended_action, created_at
FROM \`pacific_response_intelligence.incident_reports\`
ORDER BY risk_score DESC
LIMIT 10;`}
            </pre>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="mt-5 rounded-xl">
                <FileText className="h-4 w-4" /> View BigQuery evidence
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Google Cloud proof</DialogTitle>
                <DialogDescription>
                  Cloud Storage upload, BigQuery table, and SQL results powering the priority ranking.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                {gcpProofShots.map((shot) => (
                  <div key={shot.title} className="overflow-hidden rounded-xl border border-border/70 bg-muted/40">
                    <div className="border-b border-border/60 px-3 py-2">
                      <div className="text-xs font-semibold">{shot.title}</div>
                      <div className="text-[11px] text-muted-foreground">{shot.caption}</div>
                    </div>
                    <img src={shot.src} alt={shot.title} className="w-full" />
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </Card>

        {/* Cloud Storage + inline preview */}
        <div className="grid gap-4">
          <Card className="rounded-2xl border-border/70 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Cloud className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">Cloud Storage bucket</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Uploaded community incident CSVs land here before being loaded into BigQuery.
                </p>
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-border/70">
              <div className="flex items-center justify-between bg-muted/60 px-3 py-2 text-[11px] font-mono text-muted-foreground">
                <span>gs://pacific-response/incidents/</span>
                <span>10,000 rows</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-3 text-xs">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-mono">pacific_response_incidents.csv</span>
                <Badge variant="secondary" className="ml-auto rounded-full text-[10px]">1.4 MB</Badge>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-border/70 p-0 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <Database className="h-4 w-4 text-primary" />
              <div className="text-xs font-semibold">incident_reports · schema preview</div>
            </div>
            <img
              src={bqSchema.url}
              alt="BigQuery table schema for incident_reports"
              className="w-full"
            />
          </Card>
        </div>
      </div>
    </section>
  );
}

function ProofRow({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
      <div className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">{k}</div>
      <div className={cn("mt-0.5 text-sm text-foreground", mono && "font-mono text-[13px]")}>{v}</div>
    </div>
  );
}



const pipeline = [
  { icon: MessageSquare, label: "Community Reports", sub: "SMS · Web · Field · CSV" },
  { icon: Cloud, label: "Cloud Storage", sub: "Incident CSV bucket" },
  { icon: Database, label: "BigQuery", sub: "incident_reports table" },
  { icon: Zap, label: "RAPIDS / cuDF", sub: "GPU risk scoring" },
  { icon: Sparkles, label: "Gemini AI", sub: "Plain-language summary" },
  { icon: Boxes, label: "Response Dashboard", sub: "Decisions & action" },
];

function PipelineSection() {
  return (
    <section>
      <SectionTitle
        eyebrow="Architecture"
        title="Data pipeline"
        subtitle="From ground-truth community signals to actionable decisions."
      />
      <Card className="mt-6 rounded-2xl border-border/70 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
          {pipeline.map((step, i) => (
            <div key={step.label} className="flex flex-1 items-center gap-4 lg:flex-col lg:items-stretch">
              <div className="flex flex-1 items-center gap-3 rounded-xl border border-border/70 bg-background p-4 lg:flex-col lg:items-center lg:text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{step.label}</div>
                  <div className="text-xs text-muted-foreground">{step.sub}</div>
                </div>
              </div>
              {i < pipeline.length - 1 && (
                <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground lg:block" />
              )}
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

function AgentToolsSection() {
  const tools = [
    {
      name: "list_priority_reports",
      icon: Table2,
      description: "Returns ranked emergency reports sorted by AI risk score, with optional severity and limit filters.",
      example: "Show the top 5 critical reports.",
    },
    {
      name: "get_area_status",
      icon: MapPin,
      description: "Returns the current status, risk level, resource condition, and recommended action for a selected area.",
      example: "Get the status for Rakiraki.",
    },
    {
      name: "response_summary",
      icon: Sparkles,
      description: "Returns a Gemini-powered response summary and top-line emergency statistics.",
      example: "Summarize the current response situation.",
    },
  ];

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle
          eyebrow="Agent integrations"
          title="Agent-Ready Decision Tools"
          subtitle="Structured decision-support tools that can be used by AI agents, emergency systems, or future integrations."
        />
        <Badge variant="secondary" className="w-fit shrink-0 rounded-full text-xs">
          <Bot className="mr-1 h-3 w-3" /> Agent-ready
        </Badge>
      </div>
      <p className="mt-4 text-xs text-muted-foreground sm:text-sm">
        These tools allow future AI agents or external response systems to access structured decision intelligence.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Card key={tool.name} className="rounded-2xl border-border/70 p-4 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <tool.icon className="h-4 w-4" />
              </div>
              <div className="font-mono text-xs font-semibold text-primary">{tool.name}</div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{tool.description}</p>
            <div className="mt-3 rounded-lg border border-border/70 bg-muted/30 px-2.5 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Example:</span> “{tool.example}”
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="text-xs font-medium uppercase tracking-widest text-primary">{eyebrow}</div>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-center text-sm text-muted-foreground sm:px-6 sm:flex-row sm:text-left lg:px-8">
        <div className="flex items-center gap-2">
          <Waves className="h-4 w-4 text-primary" />
          Built for smarter, safer, and more resilient Pacific communities.
        </div>
        <div className="flex items-center gap-4 text-xs">
          <a
            href="https://github.com/SMani0547/DRUA-Pacific-Response-Intelligence"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <span>© {new Date().getFullYear()} Pacific Response Intelligence</span>
        </div>
      </div>
    </footer>
  );
}
