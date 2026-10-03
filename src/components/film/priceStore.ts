import { useSyncExternalStore } from "react";
import { NO_PICKS, describeBrief, describeBriefIn, estimateBrief, optionsOf, picksOf, readBriefLocally, sanitizeBrief, type Lang, type Picks, type QuickOption } from "../../lib/configurator";

/** The AI price generator on the computer at the end of the film: its one state. */
export type GenStep = "calc" | "contact" | "sent";
export type GenPhase = "idle" | "reading" | "estimating" | "estimated";
export interface GenState {
  /** the visitor's description */
  text: string;
  /** what the AI read in it (the details behind the options) */
  ai: Picks;
  /** the options ticked */
  opts: QuickOption[];
  /** the options the AI ticked (marked with a spark) */
  aiOpts: QuickOption[];
  /** the description the AI last read, and what it understood */
  read: string;
  summary: string;
  /** the language the summary is in (another language shows the picks in that language) */
  summaryLang: Lang;
  phase: GenPhase;
  step: GenStep;
  contact: { name: string; email: string; company: string; message: string; website: string };
  hint: "more" | "empty" | null;
  tried: boolean;
  sending: boolean;
  error: "rate" | "failed" | null;
}

const INITIAL: GenState = {
  text: "",
  ai: NO_PICKS,
  opts: [],
  aiOpts: [],
  read: "",
  summary: "",
  summaryLang: "en",
  phase: "idle",
  step: "calc",
  contact: { name: "", email: "", company: "", message: "", website: "" },
  hint: null,
  tried: false,
  sending: false,
  error: null,
};
let state = INITIAL;
const listeners = new Set<() => void>();

export const priceStore = {
  get: () => state,
  set(patch: Partial<GenState> | ((s: GenState) => Partial<GenState>)) {
    state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
    listeners.forEach((f) => f());
  },
  subscribe(f: () => void) {
    listeners.add(f);
    return () => {
      listeners.delete(f);
    };
  },
};
const set = priceStore.set;

export const usePrice = () => useSyncExternalStore(priceStore.subscribe, priceStore.get, () => INITIAL);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const busy = () => state.phase === "reading" || state.phase === "estimating";

export function editText(text: string) {
  set({ text: text.slice(0, 1500), hint: null });
}

export function toggleOption(id: QuickOption) {
  set((s) => ({ opts: s.opts.includes(id) ? s.opts.filter((o) => o !== id) : [...s.opts, id], aiOpts: s.aiOpts.filter((o) => o !== id), hint: null }));
}

/** The AI reads the description and ticks the options it implies (never unticking the visitor's). */
async function analyse(lang: Lang) {
  const d = state.text.trim();
  set({ phase: "reading", hint: null });
  let picks: Picks;
  let summary = "";
  try {
    const [res] = await Promise.all([
      fetch("/api/interpret", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description: d, lang }) }).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
      sleep(1000),
    ]);
    const clean = sanitizeBrief({ description: d, ...(res?.picks ?? {}) });
    picks = { type: clean.type, features: clean.features, visuals: clean.visuals, care: clean.care };
    summary = typeof res?.summary === "string" ? res.summary : "";
  } catch {
    picks = readBriefLocally(d);
  }
  const implied = optionsOf(picks);
  set((s) => ({
    ai: picks,
    opts: [...s.opts, ...implied.filter((o) => !s.opts.includes(o))],
    aiOpts: implied.filter((o) => !s.opts.includes(o) || s.aiOpts.includes(o)),
    read: d,
    summary: implied.length ? summary || (lang === "en" ? describeBrief(picks) : describeBriefIn(picks, lang)) : "",
    summaryLang: lang,
  }));
}

/** GET MY ESTIMATE: the AI reads the description (if it is new), then the price. */
export async function getEstimate(lang: Lang) {
  if (busy()) return;
  const d = state.text.trim();
  if (d.length >= 4 && d !== state.read) await analyse(lang);
  if (!estimateBrief(picksOf(state.ai, state.opts))) {
    set({ phase: "idle", hint: d.length >= 4 ? "more" : "empty" });
    return;
  }
  set({ phase: "estimating", hint: null });
  await sleep(900);
  set({ phase: "estimated" });
}

export function openRequest() {
  set({ step: "contact", tried: false, error: null });
}

export function setContact(key: keyof GenState["contact"], v: string) {
  set((s) => ({ contact: { ...s.contact, [key]: v } }));
}

export const emailOk = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/**
 * SEND PROJECT REQUEST: the contact, the description, the options ticked and what they price (the
 * server prices it again and e-mails the studio). Sent only when the server confirms; on any
 * failure (refused, offline, no answer within 25 s) the form stays filled in, with the error.
 */
export async function submit(lang: Lang) {
  const { contact: c, sending, text, ai, opts } = state;
  set({ tried: true });
  if (sending || !c.name.trim() || !emailOk(c.email)) return;
  set({ sending: true, error: null });
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 25000);
  try {
    const res = await fetch("/api/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: c.name, email: c.email, company: c.company, message: c.message, website: c.website, lang, options: opts, brief: { description: text, ...picksOf(ai, opts) } }),
      signal: abort.signal,
    });
    const answer = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    set(res.ok && answer?.ok ? { step: "sent" } : { error: res.status === 429 ? "rate" : "failed" });
  } catch {
    set({ error: "failed" });
  } finally {
    clearTimeout(timer);
    set({ sending: false });
  }
}
