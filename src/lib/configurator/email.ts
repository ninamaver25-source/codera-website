import { CARE, FEATURES, PAGES, PRODUCTS, SCALES, SERVICES, VISUALS, hasSite, type Config } from "./catalog";
import { formatRange, type Estimate } from "./estimate";
import { briefRows, describeBrief, type Brief, type BriefEstimate } from "./brief";

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
    "Sent from the BUILD YOUR PROJECT configurator on codera.si",
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

/**
 * An inquiry from the AI PRICE GENERATOR: the contact, the description as written, what the AI
 * understood, the services picked and the estimate (computed again on the server).
 */
export function composeBriefInquiry(q: { contact: { name: string; email: string; company: string; message: string }; brief: Brief; estimate: BriefEstimate; language?: string }): Mail {
  const { contact: k, brief: b, estimate: e } = q;
  const oneOff = e.total[1] > 0 ? formatRange(e.total) : "";
  const price = [oneOff, e.monthly ? `${formatRange(e.monthly)} / month` : ""].filter(Boolean).join(" + ");
  const subject = `New project — ${k.company || k.name} · ${price}`;
  const contactRows: [string, string][] = [
    ["Name", k.name],
    ["Email", k.email],
    ["Company", k.company || "—"],
    ["Language", q.language ?? "English"],
  ];
  const understood = describeBrief(b);
  const text = [
    subject,
    "",
    "CONTACT",
    ...contactRows.map(([x, y]) => `${x}: ${y}`),
    "",
    "PROJECT DESCRIPTION (as written)",
    b.description || "—",
    "",
    "SELECTED SERVICES",
    understood,
    ...briefRows(b).map(([x, y]) => `${x}: ${y}`),
    "",
    "ESTIMATE",
    ...e.lines.map((l) => `${l.label}: ${formatRange(l.range)}`),
    `Estimated: ${price}`,
    "",
    "ADDITIONAL MESSAGE",
    k.message || "—",
    "",
    "Sent from the AI price generator on codera.si",
  ]
    .filter((l) => l !== "")
    .join("\n");

  const row = ([x, y]: [string, string]) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#7a756c;vertical-align:top;white-space:nowrap">${esc(x)}</td><td style="padding:6px 0;color:#151412">${esc(y)}</td></tr>`;
  const block = (title: string, inner: string) =>
    `<h3 style="margin:28px 0 8px;font:600 12px/1 Helvetica,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#9a6431">${esc(title)}</h3>${inner}`;
  const html = `<div style="font:15px/1.5 Helvetica,Arial,sans-serif;color:#151412;max-width:640px">
<p style="margin:0 0 4px;font-size:13px;color:#7a756c">codERA · AI price generator</p>
<h2 style="margin:0;font-size:26px;letter-spacing:-.02em">${esc(k.company || k.name)} — ${esc(price)}</h2>
${block("Contact", `<table style="border-collapse:collapse">${contactRows.map(row).join("")}</table>`)}
${block("Project description (as written)", `<p style="margin:0;white-space:pre-wrap">${esc(b.description || "—")}</p>`)}
${block("Selected services", `<p style="margin:0 0 8px">${esc(understood)}</p><table style="border-collapse:collapse">${briefRows(b).map(row).join("")}</table>`)}
${block("Estimate", `<table style="border-collapse:collapse">${e.lines.map((l) => row([l.label, formatRange(l.range)])).join("")}<tr><td style="padding:10px 16px 0 0;font-weight:600">Estimated</td><td style="padding:10px 0 0;font-weight:600">${esc(price)}</td></tr></table>`)}
${block("Additional message", `<p style="margin:0;white-space:pre-wrap">${esc(k.message || "—")}</p>`)}
</div>`;
  return { subject, text, html, replyTo: k.email };
}

/**
 * Sends the inquiry with Resend (RESEND_API_KEY; INQUIRY_TO, default info@codera.si;
 * INQUIRY_FROM, a sender on a domain verified in Resend). Without a key, in development the
 * e-mail is printed to the server log instead; in production that is an error.
 */
export async function sendInquiry(mail: Mail): Promise<{ ok: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_TO || "info@codera.si";
  const from = process.env.INQUIRY_FROM || "codERA <onboarding@resend.dev>";
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[inquiry] RESEND_API_KEY is not set — this e-mail would go to ${to}:\n\n${mail.text}\n`);
      return { ok: true };
    }
    console.error("[inquiry] RESEND_API_KEY is not set; the project could not be sent.");
    return { ok: false };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], reply_to: mail.replyTo, subject: mail.subject, text: mail.text, html: mail.html }),
    });
    if (!res.ok) console.error("[inquiry] Resend responded", res.status, await res.text().catch(() => ""));
    return { ok: res.ok };
  } catch (err) {
    console.error("[inquiry] sending failed", err);
    return { ok: false };
  }
}
