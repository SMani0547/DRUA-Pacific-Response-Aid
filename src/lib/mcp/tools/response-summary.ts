import { defineTool } from "@lovable.dev/mcp-js";
import { aiSummary, overviewStats, priorityReports } from "@/lib/mock-data";

export default defineTool({
  name: "response_summary",
  title: "Response summary",
  description:
    "Get the Gemini AI response summary plus top-line stats (reports, high-risk areas, people affected, teams available).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const top = [...priorityReports]
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 3)
      .map((r) => ({ area: r.area, riskScore: r.riskScore, severity: r.severity }));
    return {
      content: [{ type: "text", text: aiSummary }],
      structuredContent: { summary: aiSummary, stats: overviewStats, topPriorities: top },
    };
  },
});
