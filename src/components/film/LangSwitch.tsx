"use client";

import { useEffect, useRef, useState } from "react";
import { LANGS, langInfo } from "../../lib/configurator";
import { setLang, useLang, useT } from "./i18n";

/** The language menu: English first, then Slovenian, French, Spanish, German and Croatian. */
export function LangSwitch() {
  const lang = useLang();
  const t = useT();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div className="flang" ref={box}>
      <button type="button" className="flang-btn" aria-haspopup="listbox" aria-expanded={open} aria-label={`${t.nav.language}: ${langInfo(lang).name}`} onClick={() => setOpen((v) => !v)}>
        {langInfo(lang).code}
        <i aria-hidden />
      </button>
      {open && (
        <ul className="flang-menu" role="listbox" aria-label={t.nav.language}>
          {LANGS.map((l) => (
            <li key={l.id} role="option" aria-selected={l.id === lang}>
              <button
                type="button"
                lang={l.id}
                className={l.id === lang ? "on" : undefined}
                onClick={() => {
                  setLang(l.id);
                  setOpen(false);
                }}
              >
                <b>{l.code}</b>
                <span>{l.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
