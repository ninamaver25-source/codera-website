/* eslint-disable @next/next/no-img-element */
import { PriceGenerator } from "./PriceGenerator";

/**
 * The workstation of the last chapter: a still of the office with one computer on the desk (its
 * display found by scripts/still-screens.mjs in /film/<still>.json; its soft surroundings in
 * <still>-back.webp).
 */
export const DESK = {
  still: "work-1",
  w: 3840,
  h: 2160,
  /** the display's logical size */
  screen: { w: 1440, h: 793 },
  /** the whole device (normalised x0 y0 x1 y1): what the camera frames as it arrives */
  subject: [0.26, 0.15, 0.75, 0.8] as [number, number, number, number],
  /** phones: the display's width in viewport widths as it arrives */
  phone: 0.94,
  /** larger screens: the device's width at most (viewport widths), and its offset */
  fit: 0.74,
  dx: 0,
};

/** Phones: the generator's column, centred on the display (logical px) — what the camera comes up to. */
export const GEN_COL = { w: 440, h: 700 };

/**
 * The end of the film: the AI PRICE GENERATOR on the computer. It appears as the camera moves
 * through the room toward the desk, comes into focus, and the camera comes slowly up to the
 * screen and stays there — the screen is the generator, nothing around it.
 */
export function WorkScenes() {
  return (
    <div className="ws" data-ws id="work">
      <div className="ws-scene" data-ws-scene>
        <div className="ws-world" data-ws-world aria-hidden>
          <img className="ws-back" src={`/film/${DESK.still}-back.webp`} alt="" decoding="async" />
          <img className="ws-still" data-ws-still src={`/film/${DESK.still}.webp`} alt="" decoding="async" />
        </div>
        <div className="ws-screen" data-ws-screen style={{ width: DESK.screen.w, height: DESK.screen.h }}>
          <PriceGenerator />
        </div>
      </div>
    </div>
  );
}
