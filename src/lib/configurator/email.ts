// Sends e-mail with the Resend key: this module must never reach the browser (a build error if imported there).
import "server-only";
import { CARE, FEATURES, PAGES, PRODUCTS, SCALES, SERVICES, VISUALS, hasSite, type Config } from "./catalog";
import { formatRange, type Estimate } from "./estimate";
import { QUICK_OPTIONS, briefRows, describeBrief, type Brief, type BriefEstimate, type QuickOption } from "./brief";

export interface Inquiry {
  contact: { name: string; email: string; company: string; phone: string; message: string };
  config: Config;
  estimate: Estimate;
  description: string;
  summary: string;
  source: "ai" | "rules" | "manual";
}

interface Mail {
  subject: string;
  text: string;
  html: string;
  replyTo: string;
}

const lbl = <T extends string>(list: { id: T; label: string }[], id: T) => list.find((x) => x.id === id)?.label ?? id;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** The configuration as readable lines ("Size: 5–10 pages"). */
function selections(c: Config): [string, string][] {
  const rows: [string, string][] = [["Services", c.services.map((s) => lbl(SERVICES, s)).join(", ")]];
  if (hasSite(c)) {
    rows.push(["Size", lbl(PAGES, c.pages)], ["Languages", String(c.languages)]);
    if (c.services.includes("shop")) rows.push(["Products", lbl(PRODUCTS, c.products)]);
    rows.push(["Features", c.features.map((f) => lbl(FEATURES, f)).join(", ") || "—"]);
  }
  if (c.services.includes("visuals")) {
    rows.push(["Visuals", c.visuals.map((v) => lbl(VISUALS, v)).join(", ") || "—"], ["Scale", lbl(SCALES, c.visualScale)]);
  }
  if (c.services.includes("care")) rows.push(["Care plan", lbl(CARE, c.care)]);
  return rows;
}

export function composeInquiry(q: Inquiry): Mail {
  const { contact: k, estimate: e } = q;
  const price = `${formatRange(e.total)}${e.monthly ? ` + ${formatRange(e.monthly)} / month` : ""}`;
  const subject = `New project — ${k.company || k.name} · ${price}`;
  const contactRows: [string, string][] = [
    ["Name", k.name],
    ["E-mail", k.email],
    ["Company / brand", k.company],
    ["Phone", k.phone || "—"],
  ];
  const source = q.source === "ai" ? "suggested by AI from the description, then reviewed by the visitor" : q.source === "rules" ? "suggested from the description, then reviewed by the visitor" : "chosen by hand";
  const text = [
    subject,
    "",
    "CONTACT",
    ...contactRows.map(([a, b]) => `${a}: ${b}`),
    "",
    "MESSAGE",
    k.message || "—",
    "",
    "DESCRIPTION (as written)",
    q.description || "—",
    "",
    `CONFIGURATION — ${source}`,
    q.summary ? `Understood: ${q.summary}` : "",
    ...selections(q.config).map(([a, b]) => `${a}: ${b}`),
    "",
    "ESTIMATE",
    ...e.lines.map((l) => `${l.label}: ${formatRange(l.range)}`),
    `Estimated: ${price}`,
    "",
    "Sent from the BUILD YOUR PROJECT configurator on the codERA website",
  ]
    .filter((l) => l !== "")
    .join("\n");

  const row = ([a, b]: [string, string]) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#7a756c;vertical-align:top;white-space:nowrap">${esc(a)}</td><td style="padding:6px 0;color:#151412">${esc(b)}</td></tr>`;
  const block = (title: string, inner: string) =>
    `<h3 style="margin:28px 0 8px;font:600 12px/1 Helvetica,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#701f2b">${esc(title)}</h3>${inner}`;
  const html = `<div style="font:15px/1.5 Helvetica,Arial,sans-serif;color:#151412;max-width:640px">
<p style="margin:0 0 4px;font-size:13px;color:#7a756c">codERA · Build your project</p>
<h2 style="margin:0;font-size:26px;letter-spacing:-.02em">${esc(k.company || k.name)} — ${esc(price)}</h2>
${block("Contact", `<table style="border-collapse:collapse">${contactRows.map(row).join("")}</table>`)}
${block("Message", `<p style="margin:0;white-space:pre-wrap">${esc(k.message || "—")}</p>`)}
${block("Description (as written)", `<p style="margin:0;white-space:pre-wrap">${esc(q.description || "—")}</p>`)}
${block(`Configuration — ${source}`, `${q.summary ? `<p style="margin:0 0 8px">${esc(q.summary)}</p>` : ""}<table style="border-collapse:collapse">${selections(q.config).map(row).join("")}</table>`)}
${block("Estimate", `<table style="border-collapse:collapse">${e.lines.map((l) => row([l.label, formatRange(l.range)])).join("")}<tr><td style="padding:10px 16px 0 0;font-weight:600">Estimated</td><td style="padding:10px 0 0;font-weight:600">${esc(price)}</td></tr></table>`)}
</div>`;
  return { subject, text, html, replyTo: k.email };
}

/** An inquiry from the AI PRICE GENERATOR, as the visitor sent it. */
export interface BriefInquiry {
  contact: { name: string; email: string; company: string; message: string };
  /** the picks the estimate is made from */
  brief: Brief;
  /** the description as written (line breaks kept) */
  description: string;
  /** the options ticked on the screen */
  options: QuickOption[];
  /** computed again on the server from the picks */
  estimate: BriefEstimate;
  /** the language the visitor used the site in */
  language: string;
  sentAt?: Date;
}

/**
 * The e-mail to the studio: who wrote, the estimated price, everything selected, the description
 * as written and the message. Replying answers the visitor (Reply-To is their address).
 */
export function composeBriefInquiry(q: BriefInquiry): Mail {
  const { contact: k, brief: b, estimate: e } = q;
  const oneOff = e.total[1] > 0 ? formatRange(e.total) : "";
  const price = [oneOff, e.monthly ? `${formatRange(e.monthly)} / month` : ""].filter(Boolean).join(" + ");
  const who = k.company ? `${k.name} (${k.company})` : k.name;
  const subject = `New inquiry — ${who} · ${price}`;
  const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Ljubljana" }).format(q.sentAt ?? new Date());
  const contactRows: [string, string][] = [
    ["Name", k.name],
    ["Email", k.email],
    ["Company", k.company || "—"],
    ["Language", q.language],
    ["Sent", `${when} (Ljubljana time)`],
  ];
  const lines: [string, string][] = e.lines.map((l) => [l.label, formatRange(l.range)]);
  const understood = describeBrief(b);
  const selected: [string, string][] = [["Options selected", q.options.map((o) => lbl(QUICK_OPTIONS, o)).join(", ") || "—"], ...briefRows(b)];
  const description = q.description || b.description || "—";
  const message = k.message || "—";

  const text = [
    `New inquiry from the codERA website — ${who}`,
    "",
    "CONTACT",
    ...contactRows.map(([x, y]) => `${x}: ${y}`),
    "",
    "ESTIMATED PRICE",
    price,
    ...lines.map(([x, y]) => `  ${x}: ${y}`),
    "",
    "SELECTED SERVICES & OPTIONS",
    ...(understood ? [understood] : []),
    ...selected.map(([x, y]) => `${x}: ${y}`),
    "",
    "PROJECT DESCRIPTION (as written)",
    description,
    "",
    "ADDITIONAL MESSAGE",
    message,
    "",
    "—",
    `Reply to this email to answer ${k.name} directly (${k.email}).`,
    "Sent from the AI price generator on the codERA website. The estimate is computed on the server from the options above.",
  ].join("\n");

  const tr = (x: string, yHtml: string, strong = false) =>
    `<tr><td style="padding:6px 18px 6px 0;color:#7a756c;vertical-align:top;white-space:nowrap${strong ? ";font-weight:600;color:#151412" : ""}">${esc(x)}</td><td style="padding:6px 0;color:#151412${strong ? ";font-weight:600" : ""}">${yHtml}</td></tr>`;
  const table = (rows: string[]) => `<table role="presentation" style="border-collapse:collapse">${rows.join("")}</table>`;
  const block = (title: string, inner: string) =>
    `<h3 style="margin:28px 0 8px;font:600 12px/1 Helvetica,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#9a6431">${esc(title)}</h3>${inner}`;
  const para = (x: string) => `<p style="margin:0;white-space:pre-wrap">${esc(x)}</p>`;
  const mailto = `<a href="mailto:${esc(k.email)}" style="color:#9a6431">${esc(k.email)}</a>`;
  const html = `<div style="font:15px/1.5 Helvetica,Arial,sans-serif;color:#151412;max-width:640px">
<p style="margin:0 0 4px;font-size:13px;color:#7a756c">codERA · New inquiry from the website</p>
<h2 style="margin:0;font-size:26px;letter-spacing:-.02em">${esc(who)}</h2>
<p style="margin:6px 0 0;font-size:20px;font-weight:600">${esc(price)}</p>
${block("Contact", table(contactRows.map(([x, y]) => tr(x, x === "Email" ? mailto : esc(y)))))}
${block("Estimated price", table([...lines.map(([x, y]) => tr(x, esc(y))), tr("Estimated", esc(price), true)]))}
${block("Selected services & options", `${understood ? `<p style="margin:0 0 8px">${esc(understood)}</p>` : ""}${table(selected.map(([x, y]) => tr(x, esc(y))))}`)}
${block("Project description (as written)", para(description))}
${block("Additional message", para(message))}
<p style="margin:32px 0 0;padding-top:14px;border-top:1px solid #e4ded3;font-size:13px;color:#7a756c">Reply to this email to answer ${esc(k.name)} directly. Sent from the AI price generator on the codERA website; the estimate is computed on the server from the options above.</p>
</div>`;
  return { subject, text, html, replyTo: k.email };
}

/** Where inquiries go, and the sender (an address on the domain verified in Resend). */
const INBOX = "info@cod-era.com";
const SENDER = "codERA Website <website@cod-era.com>";

export type SendResult = { ok: true } | { ok: false; reason: "config" | "rejected" | "unreachable" };

/**
 * Sends the inquiry with Resend. Configuration (server-side environment variables only, never in
 * code): RESEND_API_KEY (required); INQUIRY_TO (default info@cod-era.com); INQUIRY_FROM (default
 * codERA Website <website@cod-era.com>). Without a key, development prints the e-mail to the
 * server log instead; production reports a failure. A slow or failed attempt is tried once more
 * with the same idempotency key, so Resend never sends the same inquiry twice.
 */
export async function sendInquiry(mail: Mail): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  const to = process.env.INQUIRY_TO?.trim() || INBOX;
  const from = process.env.INQUIRY_FROM?.trim() || SENDER;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[inquiry] RESEND_API_KEY is not set — this e-mail would go to ${to} (from ${from}, reply-to ${mail.replyTo}):\n\nSubject: ${mail.subject}\n\n${mail.text}\n`);
      return { ok: true };
    }
    console.error("[inquiry] RESEND_API_KEY is not set (Vercel → Project → Settings → Environment Variables); the inquiry was not sent.");
    return { ok: false, reason: "config" };
  }
  const body = JSON.stringify({ from, to: [to], reply_to: mail.replyTo, subject: mail.subject, text: mail.text, html: mail.html });
  const idempotencyKey = crypto.randomUUID();
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body,
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return { ok: true };
      // Resend says what is wrong (an invalid key, a sender domain that is not verified …); the visitor sees a general message.
      console.error(`[inquiry] Resend refused the e-mail (HTTP ${res.status}):`, (await res.text().catch(() => "")).slice(0, 500));
      if (res.status !== 429 && res.status < 500) return { ok: false, reason: "rejected" };
    } catch (err) {
      console.error(`[inquiry] Resend could not be reached (attempt ${attempt}):`, err instanceof Error ? err.message : err);
    }
    if (attempt === 1) await new Promise((r) => setTimeout(r, 600));
  }
  return { ok: false, reason: "unreachable" };
}
