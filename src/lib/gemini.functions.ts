import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ReportSchema = z.object({
  area: z.string(),
  issue: z.string(),
  severity: z.string(),
  peopleAffected: z.number(),
  riskScore: z.number(),
  resources: z.string().optional(),
});

const InputSchema = z.object({
  reports: z.array(ReportSchema).max(50),
});

export const generateResponseSummary = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }

    const top = [...data.reports]
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 8);

    const bullets = top
      .map(
        (r) =>
          `- ${r.area} | ${r.issue} | ${r.severity} | risk ${r.riskScore} | ${r.peopleAffected} affected | ${r.resources ?? "—"}`,
      )
      .join("\n");

    const prompt = `You are an emergency-response analyst for Pacific Response Intelligence.
Given the current priority incidents below, write a concise plain-language response summary
for an emergency operations center. Cover: (1) which areas to prioritize and why,
(2) recommended sequence of actions with rough timing, (3) signals informing the decision.
Use 2-3 short paragraphs. Do not invent data outside the list.

Incidents:
${bullets}`;

    const model = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini API error [${res.status}]: ${body.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text =
      json.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("")
        .trim() ?? "";

    if (!text) throw new Error("Gemini returned an empty response.");

    return { summary: text, generatedAt: new Date().toISOString(), model };
  });
