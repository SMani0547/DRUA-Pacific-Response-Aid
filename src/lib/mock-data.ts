export type Severity = "Critical" | "High" | "Medium" | "Low";

export interface PriorityReport {
  id: string;
  area: string;
  issue: string;
  severity: Severity;
  peopleAffected: number;
  resources: string;
  riskScore: number;
  action: string;
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
