import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const IncidentSchema = z.object({
  area: z.string(),
  issue_type: z.string(),
  severity: z.string(),
  people_affected: z.number(),
  resource_status: z.string().optional().default("Unknown"),
  road_access: z.string().optional().default("Unknown"),
  risk_score: z.number(),
  recommended_action: z.string().optional().default(""),
});

const BodySchema = z.object({
  incidents: z.array(IncidentSchema),
});

type Incident = z.infer<typeof IncidentSchema>;

const PROMPT_INSTRUCTIONS =
  "You are an emergency response decision-support assistant for Fiji and Pacific communities. " +
  "Based on the top highest-risk incidents below, generate a clear response summary for decision makers. " +
  "Explain which area should be prioritized first, why it is urgent, what resources may be needed, " +
  "and what the next action should be. Keep the response practical, concise, and suitable for disaster response teams.";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function fallbackSummary(top: Incident): string {
  return (
    `Priority focus: ${top.area}. A ${top.severity.toLowerCase()} ${top.issue_type.toLowerCase()} ` +
    `incident is affecting approximately ${top.people_affected.toLocaleString()} people ` +
    `(risk score ${top.risk_score}). Resource status is ${top.resource_status} and road access is ${top.road_access}. ` +
    `Recommended next action: ${top.recommended_action || "dispatch a response team immediately and reassess within the next operational cycle."}`
  );
}

async function callGemini(apiKey: string, incidents: Incident[]): Promise<string> {
  const bullets = incidents
    .map(
      (i, idx) =>
        `${idx + 1}. ${i.area} — ${i.issue_type} | severity: ${i.severity} | risk: ${i.risk_score} | ` +
        `people affected: ${i.people_affected} | resources: ${i.resource_status} | road access: ${i.road_access} | ` +
        `current recommendation: ${i.recommended_action || "n/a"}`,
    )
    .join("\n");

  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${PROMPT_INSTRUCTIONS}\n\nTop incidents:\n${bullets}` }],
        },
      ],
      generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error [${res.status}]: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim() ?? "";

  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
}

export const Route = createFileRoute("/api/gemini-summary")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json(400, { error: "Request body must be valid JSON." });
        }

        const parsed = BodySchema.safeParse(raw);
        if (!parsed.success) {
          return json(400, {
            error: "Invalid request body. Expected { incidents: Incident[] }.",
            details: parsed.error.flatten(),
          });
        }

        const { incidents } = parsed.data;
        if (incidents.length === 0) {
          return json(400, { error: "`incidents` must contain at least one entry." });
        }

        const ranked = [...incidents].sort((a, b) => b.risk_score - a.risk_score);
        const top = ranked.slice(0, 5);
        const topArea = top[0].area;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return json(500, {
            error:
              "GEMINI_API_KEY is not configured on the server. Add it in project settings to enable live Gemini summaries.",
            top_area: topArea,
            incidents_analyzed: top.length,
          });
        }

        try {
          const summary = await callGemini(apiKey, top);
          return json(200, {
            summary,
            top_area: topArea,
            generated_by: "Gemini",
            incidents_analyzed: top.length,
          });
        } catch (err) {
          console.error("Gemini summary generation failed:", err);
          return json(200, {
            summary: fallbackSummary(top[0]),
            top_area: topArea,
            generated_by: "fallback",
            incidents_analyzed: top.length,
            warning:
              err instanceof Error
                ? `Gemini call failed, returned fallback summary. ${err.message}`
                : "Gemini call failed, returned fallback summary.",
          });
        }
      },
    },
  },
});
