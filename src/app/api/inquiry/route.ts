import { NextResponse } from "next/server";
import { estimate, estimateBrief, isLang, langInfo, sanitize, sanitizeBrief } from "../../../lib/configurator";
import { composeBriefInquiry, composeInquiry, sendInquiry } from "../../../lib/configurator/email";
import { allow, clientKey } from "../../../lib/rateLimit";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+$/g, "").slice(0, max).trim() : "");

/**
 * POST the project and the contact details. The estimate is computed again here from the
 * configuration (never taken from the browser) and everything is e-mailed to the studio.
 */
export async function POST(request: Request) {
  if (!allow(`inquiry:${clientKey(request)}`, 5, 30 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  // A field people never see: bots fill it in.
  if (str(body.website, 200)) return NextResponse.json({ ok: true });

  const contact = {
    name: str(body.name, 120),
    email: str(body.email, 200),
    company: str(body.company, 160),
    phone: str(body.phone, 60),
    message: str(body.message, 3000),
  };
  if (!contact.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    return NextResponse.json({ error: "Please add your name and email." }, { status: 400 });
  }
  // The AI PRICE GENERATOR: the description, the services picked and the estimate travel with the
  // inquiry (the estimate is computed again here, never taken from the browser).
  if (body.brief !== undefined) {
    const brief = sanitizeBrief(body.brief);
    const est = estimateBrief(brief);
    if (!est) return NextResponse.json({ error: "Describe your project or choose a service first." }, { status: 400 });
    const language = isLang(body.lang) ? langInfo(body.lang).english : "English";
    const sent = await sendInquiry(composeBriefInquiry({ contact, brief, estimate: est, language }));
    if (!sent.ok) return NextResponse.json({ error: "We couldn't send your project just now. Please try again, or write to us directly." }, { status: 503 });
    return NextResponse.json({ ok: true });
  }

  if (!contact.company) return NextResponse.json({ error: "Please add your company." }, { status: 400 });
  const config = sanitize(body.config);
  if (!config.services.length) return NextResponse.json({ error: "Choose at least one service." }, { status: 400 });

  const mail = composeInquiry({
    contact,
    config,
    estimate: estimate(config),
    description: str(body.description, 1500),
    summary: str(body.summary, 300),
    source: body.source === "ai" ? "ai" : body.source === "rules" ? "rules" : "manual",
  });
  const sent = await sendInquiry(mail);
  if (!sent.ok) return NextResponse.json({ error: "We couldn't send your project just now. Please try again, or write to us directly." }, { status: 503 });
  return NextResponse.json({ ok: true });
}
