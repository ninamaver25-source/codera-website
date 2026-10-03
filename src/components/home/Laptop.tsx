/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import { quadToMatrix3d } from "./geometry";
import { HINGE, LAPTOP_H, LAPTOP_W, LID_BOX } from "./laptop-geometry";

/** The laptop cutout (1600 × 1062) and the corners of its display, TL TR BR BL. */
export const LAPTOP = {
  src: "/images/devices/laptop.png",
  lid: "/images/devices/laptop-lid.png",
  base: "/images/devices/laptop-base.png",
  iw: LAPTOP_W,
  ih: LAPTOP_H,
  quad: [
    [299, 121],
    [1300, 121],
    [1310, 717],
    [287, 717],
  ] as [number, number][],
  css: [1440, 900] as [number, number],
};

/**
 * The laptop with a 1440 × 900 DOM display mapped onto its screen, built from a base and a lid
 * that can close: `--lid` (degrees, 0 = open, about -92 = closed) rotates the lid about the hinge.
 * Its size comes from `--lk`, the scale of the 1600-px cutout.
 */
export function Laptop({ k, className = "", children }: { k?: number; className?: string; children: ReactNode }) {
  const [cw, ch] = LAPTOP.css;
  return (
    <div className={`laptop ${className}`} style={k !== undefined ? ({ "--lk": k } as React.CSSProperties) : undefined}>
      <div className="laptop-inner">
        <div className="lap-3d" data-lid>
          <img className="lap-base" src={LAPTOP.base} alt="" width={LAPTOP_W} height={LAPTOP_H - HINGE} style={{ top: HINGE }} draggable={false} decoding="async" />
          <div className="lid lid-front" style={{ height: HINGE }}>
            <img src={LAPTOP.lid} alt="" width={LAPTOP_W} height={HINGE} draggable={false} decoding="async" />
            <div className="laptop-screen" style={{ width: cw, height: ch, transform: quadToMatrix3d(cw, ch, LAPTOP.quad) }}>
              {children}
            </div>
          </div>
          <div className="lid lid-back" style={{ height: HINGE }} aria-hidden>
            <i style={{ left: LID_BOX.left, top: LID_BOX.top, width: LID_BOX.width, height: LID_BOX.height }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** A small, fluid laptop for the service cards: the screen is a plain box over the cutout. */
export function MiniLaptop({ children }: { children: ReactNode }) {
  return (
    <div className="mini-laptop">
      <img src={LAPTOP.src} alt="" width={LAPTOP.iw} height={LAPTOP.ih} draggable={false} loading="lazy" decoding="async" />
      <div className="mini-screen">{children}</div>
    </div>
  );
}

/** A small, fluid phone for the care card: the screen is a plain box over the cutout. */
export function MiniPhone({ children }: { children: ReactNode }) {
  return (
    <div className="mini-phone">
      <img src="/images/devices/phone.png" alt="" width={1062} height={1600} draggable={false} loading="lazy" decoding="async" />
      <div className="mini-phone-screen">{children}</div>
    </div>
  );
}
