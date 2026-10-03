"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Shows a 1440-wide website mock-up at the width of the page, as a real page you scroll: the
 * mock-up's own scrolling stage is unrolled and the whole thing is zoomed to fit.
 */
export function SiteViewer({ url, children }: { url: string; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setZoom(Math.min(1, el.clientWidth / 1440));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="viewer">
      <div className="viewer-bar" aria-hidden>
        <span className="viewer-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="viewer-url">{url}</span>
      </div>
      <div ref={box} className="viewer-box">
        <div className="viewer-page" style={{ zoom }}>
          {children}
        </div>
      </div>
    </div>
  );
}
