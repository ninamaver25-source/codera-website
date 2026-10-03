"use client";

import { useState, type FormEvent } from "react";
import { CHIPS, PLACEHOLDER, estimateLocally, type Estimate } from "../../lib/estimator";

const EXAMPLE = estimateLocally({ description: PLACEHOLDER });
const money = (n: number) => `€${n.toLocaleString("en-US")}`;

type Status = "idle" | "loading" | "done" | "error";

export function Estimator() {
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Estimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = (chip: string) => setTags((t) => (t.includes(chip) ? t.filter((c) => c !== chip) : [...t, chip]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() && tags.length === 0) {
      setError("Describe your project or pick a few options first.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text, tags }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Something went wrong.");
      setResult((await res.json()) as Estimate);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  };

  const shown = result ?? EXAMPLE;
  const isExample = !result;

  return (
    <section className="sec estimator" id="estimator" aria-labelledby="est-h">
      <header className="sec-head sec-head-left">
        <span className="eyebrow">AI estimator</span>
        <h2 id="est-h" className="sec-title">
          Get an instant
          <br />
          project estimate.
        </h2>
        <p className="sec-line">Describe your project and get a personalised estimate in seconds — powered by AI.</p>
      </header>
      <div className="est-grid">
        <form className="est-form" onSubmit={submit}>
          <div className="est-box">
            <label className="sr-only" htmlFor="est-text">Describe your project</label>
            <textarea id="est-text" rows={3} placeholder={PLACEHOLDER} value={text} onChange={(e) => setText(e.target.value)} maxLength={1500} />
            <button type="submit" className="est-go" aria-label="Generate estimate" disabled={status === "loading"}>
              →
            </button>
          </div>
          <div className="est-row">
            <div className="est-chips" role="group" aria-label="Quick select">
              {CHIPS.map((c) => (
                <button key={c} type="button" aria-pressed={tags.includes(c)} onClick={() => toggle(c)}>
                  {c}
                </button>
              ))}
            </div>
            <button type="submit" className="est-submit" disabled={status === "loading"}>
              {status === "loading" ? "Analysing…" : "Generate estimate →"}
            </button>
          </div>
          {status === "error" && error && (
            <p className="est-error" role="alert">
              {error}
            </p>
          )}
        </form>
        <aside className="est-result" data-state={status} aria-live="polite">
          <span className="est-label">
            Estimated project
            {isExample && <em> · example</em>}
          </span>
          <div className="est-price">
            {money(shown.min)} – {money(shown.max)}
          </div>
          <ul className="est-items">
            {shown.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
          <p className="est-note">{shown.note}</p>
        </aside>
      </div>
    </section>
  );
}
