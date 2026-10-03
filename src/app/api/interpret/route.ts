import { NextResponse } from "next/server";
import { describeBrief, describeBriefIn, isLang, readBriefLocally, type Lang, type Picks } from "../../../lib/configurator";
import { readBriefWithModel } from "../../../lib/configurator/model";
import { allow, clientKey } from "../../../lib/rateLimit";

const empty = (p: Picks) => !p.type && !p.features.length && !p.visuals.length && !p.care;

/** POST { description, lang } → { picks, summary, source }: the AI price generator reads a description (any language) and answers in the visitor's. */
export async function POST(request: Request) {
  if (!allow(`interpret:${clientKey(request)}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Try again in a few minutes." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const raw = (body as { description?: unknown })?.description;
  const description = typeof raw === "string" ? raw.slice(0, 1500).trim() : "";
  const l = (body as { lang?: unknown })?.lang;
  const lang: Lang = isLang(l) ? l : "en";
  const say = (p: Picks) => (lang === "en" ? describeBrief(p) : describeBriefIn(p, lang));
  if (description.length < 4) return NextResponse.json({ error: "Tell us a little more about the project." }, { status: 400 });

  const ai = await readBriefWithModel(description, lang);
  if (ai && !empty(ai.picks)) return NextResponse.json({ picks: ai.picks, summary: ai.summary || say(ai.picks), source: "ai" });
  const picks = readBriefLocally(description);
  return NextResponse.json({ picks, summary: say(picks), source: "rules" });
}
