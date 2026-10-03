import { CARE_OPTIONS, FEATURE_OPTIONS, TYPE_OPTIONS, VISUAL_OPTIONS, sanitizeBrief, type Picks } from "./brief";
import { langInfo, type Lang } from "./locale";

/**
 * Reads a project description with Claude and picks the price generator's options. The model can
 * only answer through a tool whose fields are those options; the answer is sanitised again here.
 * It never sees or sets a price.
 *
 * Needs ANTHROPIC_API_KEY (optional ANTHROPIC_MODEL). Without a key this returns null and the
 * rule-based reader (brief.ts) is used.
 */

const ids = (list: { id: string }[]) => list.map((x) => x.id);
const glossary = (list: { id: string; label: string }[]) => list.map((x) => `${x.id} = ${x.label}`).join("; ");

const tool = (language: string) => ({
  name: "pick_services",
  description: "Record the services that match the visitor's project description.",
  input_schema: {
    type: "object",
    properties: {
      type: { type: ["string", "null"], enum: [...ids(TYPE_OPTIONS), null], description: `The kind of website, or null if none is needed. ${glossary(TYPE_OPTIONS)}. A restaurant, company or clinic site is usually business; a site whose main purpose is booking (apartments, salon) is booking.` },
      features: { type: "array", items: { type: "string", enum: ids(FEATURE_OPTIONS) }, description: `Only features asked for or clearly implied (reservations or appointments → booking; two languages → multilingual). ${glossary(FEATURE_OPTIONS)}.` },
      visuals: { type: "array", items: { type: "string", enum: ids(VISUAL_OPTIONS) }, description: `Visual production asked for or clearly implied (a photo gallery → website). ${glossary(VISUAL_OPTIONS)}.` },
      care: { type: ["string", "null"], enum: [...ids(CARE_OPTIONS), null], description: `Monthly website care if asked for, else null. ${glossary(CARE_OPTIONS)}.` },
      summary: { type: "string", description: `One short sentence in ${language} that says back what the visitor needs, e.g. (in English) 'A business website with online booking, plus website visuals.'` },
    },
    required: ["type", "features", "visuals", "care", "summary"],
  },
});

const SYSTEM =
  "You read project descriptions for codERA, a studio for custom websites, visual production and website care. " +
  "Map the visitor's description (in any language) onto the tool's options and nothing else. Choose what is asked for or clearly implied; do not add extras. " +
  "If the description is not about a project, return null and empty lists. Never mention or estimate prices.";

export async function readBriefWithModel(description: string, lang: Lang = "en"): Promise<{ picks: Picks; summary: string } | null> {
  const TOOL = tool(langInfo(lang).english);
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
        max_tokens: 600,
        system: SYSTEM,
        tools: [TOOL],
        tool_choice: { type: "tool", name: TOOL.name },
        messages: [{ role: "user", content: description }],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { content?: { type: string; input?: Record<string, unknown> }[] };
    const input = json.content?.find((b) => b.type === "tool_use")?.input;
    if (!input) return null;
    const summary = typeof input.summary === "string" ? input.summary.replace(/\s+/g, " ").trim().slice(0, 240) : "";
    const { type, features, visuals, care } = sanitizeBrief(input);
    return { picks: { type, features, visuals, care }, summary };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
