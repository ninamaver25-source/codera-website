"use client";

import Link from "next/link";
import { useState } from "react";

const LINKS = [
  { label: "Home", to: "top", href: "/#top" },
  { label: "Services", to: "services", href: "/#services" },
  { label: "Process", to: "process", href: "/#process" },
  { label: "Estimator", to: "estimator", href: "/#estimator" },
  { label: "Contact", to: "contact", href: "/#contact" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"EN" | "SI">("EN");
  const [langOpen, setLangOpen] = useState(false);

  return (
    <header className="nav">
      <Link className="nav-brand" href="/#top" data-to="top" aria-label="codERA — home">
        <span>cod</span>ERA
      </Link>
      <div className="nav-right">
        <nav className="nav-links" aria-label="Primary">
          {LINKS.map((l) => (
            <Link key={l.to} href={l.href} data-to={l.to}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="nav-lang">
          <button type="button" className="nav-pill" aria-haspopup="listbox" aria-expanded={langOpen} onClick={() => setLangOpen((o) => !o)}>
            {lang} <i aria-hidden>⌄</i>
          </button>
          {langOpen && (
            <ul role="listbox" aria-label="Language">
              {(["EN", "SI"] as const).map((l) => (
                <li key={l} role="option" aria-selected={lang === l}>
                  <button
                    type="button"
                    onClick={() => {
                      setLang(l);
                      setLangOpen(false);
                    }}
                  >
                    {l === "EN" ? "English" : "Slovenščina"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" className="nav-burger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? "×" : "☰"}
        </button>
      </div>
      {open && (
        <div className="nav-sheet" onClick={() => setOpen(false)}>
          {LINKS.map((l) => (
            <Link key={l.to} href={l.href} data-to={l.to}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
