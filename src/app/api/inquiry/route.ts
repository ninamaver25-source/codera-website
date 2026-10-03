import { NextResponse } from "next/server";
import { estimate, estimateBrief, isLang, langInfo, sanitize, sanitizeBrief, sanitizeOptions } from "../../../lib/configurator";
import { composeBriefInquiry, composeInquiry, sendInquiry } from "../../../lib/configurator/email";
import { allow, clientKey } from "../../../lib/rateLimit";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+$/g, "").slice(0, max).trim() : "");
/** One line (names go into the e-mail subject). */
const line = (v: unknown, max: number) => str(v, max).replace(/\s+/g, " ");
/** Text as written: line breaks kept, at most one empty line in a row. */
const asWritten = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r\n?/g, "\n").replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, max) : "");
const FAILED = "We couldn’t send your inquiry just now. Please try again, or email info@cod-era.com.";

/**
 * POST the project and the contact details. The estimate is computed again here from the
 * configuration (never taken from the browser) and everything is e-mailed to the studio with
 * Resend (src/lib/configurator/email.ts — the key stays on the server).
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
    name: line(body.name, 120),
    email: str(body.email, 200),
    company: line(body.company, 160),
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
    const sent = await sendInquiry(
      composeBriefInquiry({
        contact,
        brief,
        estimate: est,
        description: asWritten((body.brief as { description?: unknown } | null)?.description, 1500),
        options: sanitizeOptions(body.options),
        language: isLang(body.lang) ? langInfo(body.lang).english : "English",
      }),
    );
    // 500: the server is not configured (no RESEND_API_KEY); 502: Resend refused or could not be reached
    if (!sent.ok) return NextResponse.json({ error: FAILED }, { status: sent.reason === "config" ? 500 : 502 });
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
  if (!sent.ok) return NextResponse.json({ error: FAILED }, { status: sent.reason === "config" ? 500 : 502 });
  return NextResponse.json({ ok: true });
}
