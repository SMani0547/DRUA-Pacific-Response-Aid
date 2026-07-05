import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { priorityReports } from "@/lib/mock-data";

export default defineTool({
  name: "list_priority_reports",
  title: "List priority reports",
  description:
    "List current community emergency reports across monitored Pacific areas, ranked by AI risk score.",
  inputSchema: {
    minSeverity: z
      .enum(["Low", "Medium", "High", "Critical"])
      .optional()
      .describe("Only include reports at this severity or higher."),
    limit: z.number().int().min(1).max(50).optional().describe("Maximum number of reports to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ minSeverity, limit }) => {
    const order = { Low: 1, Medium: 2, High: 3, Critical: 4 } as const;
    const threshold = minSeverity ? order[minSeverity] : 0;
    const rows = priorityReports
      .filter((r) => order[r.severity] >= threshold)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, limit ?? priorityReports.length);
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { reports: rows },
    };
  },
});
