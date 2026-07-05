import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Clock,
  Database,
  Gauge,
  MessageSquare,
  Send,
  Shield,
  Sparkles,
  Timer,
  TrendingUp,
  Users,
  Waves,
  Zap,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  affectedByArea,
  aiSummary,
  chatSuggestions,
  getMockAssistantReply,
  overviewStats,
  priorityReports,
  riskTrend,
  type ChatMessage,
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
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <main id="dashboard" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        <OverviewCards />
        <div className="grid gap-6 lg:grid-cols-3">
          <TrendChart />
          <AffectedChart />
        </div>
        <PriorityTable />
        <div className="grid gap-6 lg:grid-cols-5">
          <AiSummaryCard />
          <ChatPanel />
        </div>
        <AccelerationSection />
        <PipelineSection />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Waves className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Pacific Response</div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Intelligence</div>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#dashboard" className="hover:text-foreground">Dashboard</a>
          <a href="#priority" className="hover:text-foreground">Priorities</a>
          <a href="#ai" className="hover:text-foreground">AI Insights</a>
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
    <section className="relative overflow-hidden border-b border-border/60">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 500px at 80% -10%, oklch(0.72 0.14 210 / 0.18), transparent), radial-gradient(800px 400px at 10% 10%, oklch(0.35 0.14 255 / 0.15), transparent)",
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

function OverviewCards() {
  return (
    <section>
      <SectionTitle
        eyebrow="Live overview"
        title="Situation at a glance"
        subtitle="Aggregated across all monitored districts in the last 24 hours."
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {overviewStats.map((stat, i) => {
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

function AffectedChart() {
  return (
    <Card className="rounded-2xl border-border/70 p-6 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">By area</div>
      <h3 className="mt-1 text-lg font-semibold">People affected</h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={affectedByArea} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
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

function PriorityTable() {
  return (
    <section id="priority">
      <SectionTitle
        eyebrow="Priority queue"
        title="Recommended response order"
        subtitle="Ranked by AI risk score combining severity, population, and available resources."
      />
      <Card className="mt-6 overflow-hidden rounded-2xl border-border/70 shadow-sm">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {priorityReports.map((r) => (
                <tr key={r.id} className="transition hover:bg-muted/40">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
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

function AiSummaryCard() {
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
        <Badge variant="outline" className="ml-auto rounded-full">Updated 2 min ago</Badge>
      </div>
      <div className="mt-5 space-y-4 text-sm leading-relaxed text-foreground/90">
        {aiSummary.split("\n\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/15" variant="secondary">Rakiraki · 94</Badge>
        <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/15" variant="secondary">Ba · 89</Badge>
        <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/15" variant="secondary">Lautoka · 71</Badge>
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
  const pandas = 4.2;
  const rapids = 0.8;
  const speedup = useMemo(() => (pandas / rapids).toFixed(1), []);
  return (
    <section id="acceleration">
      <SectionTitle
        eyebrow="Performance"
        title="NVIDIA RAPIDS Acceleration"
        subtitle="Accelerated processing lets response teams analyze larger community datasets and make faster decisions."
      />
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <BenchmarkCard
          label="Pandas (CPU)"
          value={`${pandas}s`}
          icon={Timer}
          barWidth={100}
          tone="muted"
          description="Standard dataframe processing on CPU."
        />
        <BenchmarkCard
          label="RAPIDS / cuDF (GPU)"
          value={`${rapids}s`}
          icon={Zap}
          barWidth={(rapids / pandas) * 100}
          tone="primary"
          description="GPU-accelerated dataframe processing."
        />
        <Card className="flex flex-col justify-between rounded-2xl border-border/70 p-6 shadow-sm">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Result</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-5xl font-semibold tracking-tight text-primary">{speedup}x</span>
              <span className="text-sm text-muted-foreground">faster</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Faster processing means emergency teams reprioritize as new community reports arrive — critical when
            conditions change by the minute during floods and cyclones.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-primary">
            <TrendingUp className="h-4 w-4" /> 37 minutes saved per incident, on average.
          </div>
        </Card>
      </div>
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

const pipeline = [
  { icon: MessageSquare, label: "Community Reports", sub: "SMS · Web · Field" },
  { icon: Database, label: "BigQuery", sub: "Ingestion & storage" },
  { icon: Zap, label: "RAPIDS / cuDF", sub: "GPU processing" },
  { icon: Sparkles, label: "Gemini AI", sub: "Insights & summary" },
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
        <div className="text-xs">© {new Date().getFullYear()} Pacific Response Intelligence</div>
      </div>
    </footer>
  );
}
