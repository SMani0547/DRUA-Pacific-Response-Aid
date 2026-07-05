import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { priorityReports } from "@/lib/mock-data";

export default defineTool({
  name: "get_area_status",
  title: "Get area status",
  description:
    "Get the current emergency status, AI risk score, and recommended action for a specific Pacific area.",
  inputSchema: {
    area: z
      .string()
      .min(1)
      .describe("Area name, e.g. Rakiraki, Ba, Nadi, Lautoka, Labasa, Suva, or Tavua."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ area }) => {
    const match = priorityReports.find(
      (r) => r.area.toLowerCase() === area.toLowerCase(),
    );
    if (!match) {
      return {
        content: [{ type: "text", text: `No active report found for "${area}".` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(match, null, 2) }],
      structuredContent: { report: match },
    };
  },
});
