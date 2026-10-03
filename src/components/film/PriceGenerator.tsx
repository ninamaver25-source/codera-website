"use client";

import { useEffect, useId, useRef, useState } from "react";
import { QUICK_OPTIONS, describeBriefIn, estimateBrief, formatRangeIn, picksOf, type BriefEstimate, type Lang, type Range } from "../../lib/configurator";
import { editText, emailOk, getEstimate, openRequest, priceStore, setContact, submit, toggleOption, usePrice } from "./priceStore";
import { useLang, useT } from "./i18n";
import { EMAIL } from "./contact";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Orb() {
  return <span className="pg-orb" aria-hidden />;
}
function Dots() {
  return (
    <i className="pg-think" aria-hidden>
      <i />
      <i />
      <i />
    </i>
  );
}

/** The AI's sentence: a moment of thought, then written out (the whole sentence is there for screen readers). */
function Typed({ text }: { text: string }) {
  const [n, setN] = useState(() => (reduced() ? text.length : -9));
  useEffect(() => {
    if (n >= text.length) return;
    const id = window.setTimeout(() => setN((v) => Math.min(text.length, v + (v < 0 ? 1 : 2))), n < 0 ? 50 : 18);
    return () => window.clearTimeout(id);
  }, [n, text]);
  return (
    <>
      <span className="pg-sr">{text}</span>
      <span aria-hidden>
        {n < 0 ? (
          <Dots />
        ) : (
          <>
            {text.slice(0, n)}
            {n < text.length && <i className="pg-caret" />}
          </>
        )}
      </span>
    </>
  );
}

/** The estimate, counting up when it appears and to every new value after. */
function Count({ range, lang }: { range: Range; lang: Lang }) {
  const [shown, setShown] = useState<Range>([0, 0]);
  const from = useRef<Range>([0, 0]);
  const target = `${range[0]}-${range[1]}`;
  useEffect(() => {
    const [to0, to1] = target.split("-").map(Number);
    const [f0, f1] = from.current;
    const t0 = performance.now();
    const still = reduced();
    let raf = 0;
    const tick = (now: number) => {
      const u = still ? 1 : Math.min(1, (now - t0) / 800);
      const e = 1 - Math.pow(1 - u, 3);
      setShown(u < 1 ? [Math.round((f0 + (to0 - f0) * e) / 10) * 10, Math.round((f1 + (to1 - f1) * e) / 10) * 10] : [to0, to1]);
      if (u < 1) raf = requestAnimationFrame(tick);
      else from.current = [to0, to1];
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return <>{formatRangeIn(shown, lang)}</>;
}

const main = (e: BriefEstimate): Range => (e.total[1] > 0 ? e.total : (e.monthly ?? e.total));

/** An error that offers the studio's address instead ("… or email us at {email}."), as a link. */
function withEmail(text: string) {
  const [before, after] = text.split("{email}");
  if (after === undefined) return text;
  return (
    <>
      {before}
      <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
      {after}
    </>
  );
}

/**
 * AI PRICE GENERATOR, on the computer at the end of the film — one box: write what you want to
 * build, tick a few options if you like, GET MY ESTIMATE (the AI reads the description and ticks
 * what it implies; the price comes from the studio's price list), then — if you want — SEND
 * PROJECT REQUEST with a very short form in the same box. Laid out for the display (1440 × 793);
 * on portrait screens as a column the camera comes up to.
 */
export function PriceGenerator() {
  const uid = useId();
  const lang = useLang();
  const t = useT();
  const g = t.gen;
  const s = usePrice();
  const { text, step } = s;
  const est = estimateBrief(picksOf(s.ai, s.opts));
  const reading = s.phase === "reading";
  const estimating = s.phase === "estimating";
  const shown = !!est && s.phase === "estimated";
  const stale = s.phase === "estimated" && text.trim().length >= 4 && text.trim() !== s.read;
  const ready = shown && !stale;
  const sent = step === "sent";

  const head = (
    <header className="pg-head">
      <Orb />
      <b>codERA AI</b>
      <span className="pg-sub">{g.brand}</span>
      <span className={`pg-live${reading || estimating ? " busy" : ""}`}>
        <i aria-hidden />
        {reading ? g.reading : estimating ? g.calculating : g.online}
      </span>
    </header>
  );

  // what the AI understood, in the language now chosen (switching shows the picks in the new one)
  const summary = !s.summary ? "" : s.summaryLang === lang ? s.summary : lang === "en" ? "" : describeBriefIn(s.ai, lang);
  const aiLine = reading ? (
    <span className="pg-thinking">
      {g.readingLine} <Dots />
    </span>
  ) : summary ? (
    <Typed key={summary} text={`${g.understood}${summary}`} />
  ) : s.hint ? (
    <span className="pg-hintline">{s.hint === "more" ? g.hintMore : g.hintEmpty}</span>
  ) : (
    <span className="pg-faintline">{g.hello}</span>
  );

  const c = s.contact;
  const field = (key: "name" | "email" | "company", label: string, type = "text", auto?: string, optional = false) => {
    const bad = s.tried && !optional && (key === "email" ? !emailOk(c.email) : !c[key].trim());
    return (
      <label className="pg-field" htmlFor={`${uid}-${key}`}>
        <span className="pg-k">
          {label}
          {optional && <em>{g.optional}</em>}
        </span>
        <input id={`${uid}-${key}`} type={type} value={c[key]} autoComplete={auto} aria-invalid={bad || undefined} onChange={(e) => setContact(key, e.target.value)} />
      </label>
    );
  };

  return (
    <div className="pg">
      {head}
      {step === "calc" && (
        <>
          <div className={`pg-ask${reading ? " is-reading" : ""}`}>
            <textarea
              id={`${uid}-ask`}
              className="pg-input"
              placeholder={g.placeholder}
              value={text}
              maxLength={1500}
              aria-label={g.ask}
              data-lenis-prevent
              onChange={(e) => editText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void getEstimate(lang);
                }
              }}
            />
            <p className="pg-ai-line" aria-live="polite">
              <Orb />
              <span className="pg-ai-text">{aiLine}</span>
            </p>
          </div>
          <div className="pg-opts" role="group" aria-label={g.options} style={{ "--opt": Math.min(1, 70 / QUICK_OPTIONS.reduce((n, o) => n + g.opt[o.id].length, 0)).toFixed(3) } as React.CSSProperties}>
            {QUICK_OPTIONS.map((o) => {
              const on = s.opts.includes(o.id);
              const k = s.aiOpts.indexOf(o.id);
              const ai = on && k >= 0;
              return (
                <button
                  key={o.id}
                  type="button"
                  className={`pg-opt${on ? " on" : ""}${ai ? " ai" : ""}`}
                  style={ai ? ({ "--d": `${0.05 + k * 0.14}s` } as React.CSSProperties) : undefined}
                  aria-pressed={on}
                  onClick={() => toggleOption(o.id)}
                >
                  <i className="pg-check" aria-hidden />
                  {g.opt[o.id]}
                </button>
              );
            })}
          </div>
        </>
      )}
      {step === "contact" && est && (
        <form
          id={`${uid}-req`}
          className="pg-request"
          noValidate
          aria-label={g.send}
          onSubmit={(e) => {
            e.preventDefault();
            void submit(lang);
          }}
        >
          <div className="pg-grid">
            {field("name", g.name, "text", "name")}
            {field("email", g.email, "email", "email")}
            {field("company", g.company, "text", "organization", true)}
            <label className="pg-field pg-field-wide" htmlFor={`${uid}-msg`}>
              <span className="pg-k">
                {g.message}
                <em>{g.optional}</em>
              </span>
              <textarea id={`${uid}-msg`} data-lenis-prevent value={c.message} maxLength={3000} onChange={(e) => setContact("message", e.target.value)} />
            </label>
          </div>
          <input className="pg-hp" name="website" value={c.website} tabIndex={-1} autoComplete="off" aria-hidden onChange={(e) => setContact("website", e.target.value)} />
          <p className="pg-error" aria-live="polite">
            {s.error ? withEmail(s.error === "rate" ? g.tooMany : g.failed) : s.tried && !(c.name.trim() && emailOk(c.email)) ? (!c.name.trim() ? g.addName : g.addEmail) : ""}
          </p>
        </form>
      )}
      {sent && (
        <div className="pg-sent" aria-live="polite">
          <Orb />
          <h3>{g.thanks}</h3>
          <p>{g.received}</p>
        </div>
      )}
      <div className={`pg-foot${ready ? " is-ready" : ""}`}>
        <div className="pg-price-block" aria-live="polite">
          <span className="pg-k">{g.price}</span>
          <b className="pg-price">
            {estimating ? (
              <span className="pg-calc">
                {g.calculating} <Dots />
              </span>
            ) : shown && est ? (
              <Count range={main(est)} lang={lang} />
            ) : (
              <span className="pg-price-off">€ — – € —</span>
            )}
            {shown && est && est.total[1] === 0 && <small>{g.month}</small>}
          </b>
          {shown && est?.monthly && est.total[1] > 0 && (
            <em className="pg-month">
              + {formatRangeIn(est.monthly, lang)} {g.monthCare}
            </em>
          )}
        </div>
        <div className="pg-actions">
          {step === "calc" ? (
            <button type="button" className={`pg-cta${ready ? " go" : ""}`} disabled={reading || estimating} onClick={() => (ready ? openRequest() : void getEstimate(lang))}>
              {reading ? g.readingBtn : estimating ? g.calculatingBtn : ready ? g.send : stale ? g.update : g.get} <i aria-hidden>→</i>
            </button>
          ) : step === "contact" ? (
            <>
              <button type="button" className="pg-back" onClick={() => priceStore.set({ step: "calc" })}>
                {g.back}
              </button>
              <button type="submit" form={`${uid}-req`} className="pg-cta go" disabled={s.sending}>
                {s.sending ? g.sending : g.send} <i aria-hidden>→</i>
              </button>
            </>
          ) : (
            <span className="pg-done">
              <Orb /> {g.sent}
            </span>
          )}
        </div>
        <p className="pg-note">{step === "contact" ? g.noteForm : sent ? g.noteSent : g.note}</p>
      </div>
    </div>
  );
}
