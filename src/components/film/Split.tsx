import { Fragment } from "react";

/** Splits text into units the film reveals one by one (characters, or words). */
export function Split({ text, words = false, className }: { text: string; words?: boolean; className?: string }) {
  const parts = text.split(" ");
  return (
    <span className={className} aria-label={text} role="text">
      {parts.map((w, i) => (
        <Fragment key={i}>
          {i > 0 ? " " : null}
          <span className="w" aria-hidden>
            {words ? (
              <span className="u">{w}</span>
            ) : (
              Array.from(w).map((c, j) => (
                <span key={j} className="u">
                  {c}
                </span>
              ))
            )}
          </span>
        </Fragment>
      ))}
    </span>
  );
}
