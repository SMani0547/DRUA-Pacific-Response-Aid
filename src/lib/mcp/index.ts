import { defineMcp } from "@lovable.dev/mcp-js";
import listPriorityReports from "./tools/list-priority-reports";
import getAreaStatus from "./tools/get-area-status";
import responseSummary from "./tools/response-summary";

export default defineMcp({
  name: "pacific-response-intelligence-mcp",
  title: "Pacific Response Intelligence",
  version: "0.1.0",
  instructions:
    "Tools for querying the Pacific Response Intelligence dashboard: list current priority emergency reports, get the status of a specific area (Rakiraki, Ba, Nadi, Lautoka, Labasa, Suva, Tavua), and fetch the Gemini AI response summary.",
  tools: [listPriorityReports, getAreaStatus, responseSummary],
});
