import { clamp01, smooth, span, T } from "./time";

export interface Block {
  el: HTMLElement;
  units: HTMLElement[];
  last: Float32Array;
  visible: boolean;
}

let blocks: Record<string, Block> = {};
let cue: HTMLElement | null = null;
let heroCta: HTMLElement | null = null;
let heroScale = -1;
let lastCta = -1;

export function bindOverlay(root: HTMLElement) {
  blocks = {};
  root.querySelectorAll<HTMLElement>(".ov [data-rv]").forEach((el) => (blocks[el.dataset.rv!] = makeBlock(el)));
  cue = root.querySelector<HTMLElement>("[data-cue]");
  heroCta = root.querySelector<HTMLElement>("[data-hero-cta]");
  heroScale = -1;
  lastCta = -1;
}

/** Collects the units (characters or words) of one block of text. */
export function makeBlock(el: HTMLElement): Block {
  const units = Array.from(el.querySelectorAll<HTMLElement>(".u"));
  el.style.visibility = "hidden";
  return { el, units, last: new Float32Array(units.length).fill(-1), visible: false };
}

/** Characters arrive and leave in a soft sweep, left to right (the TopTier gesture). */
export function reveal(b: Block | undefined, pin: number, pout: number) {
  if (!b) return;
  const n = b.units.length;
  const s = Math.max(3, n * 0.38);
  let any = false;
  for (let i = 0; i < n; i++) {
    const a = smooth(clamp01((pin * (n + s) - i) / s));
    const o = smooth(clamp01((pout * (n + s) - i) / s));
    const v = a * (1 - o);
    if (v > 0.002) any = true;
    if (Math.abs(v - b.last[i]) > 0.003) {
      b.units[i].style.opacity = v.toFixed(3);
      b.last[i] = v;
    }
  }
  if (any !== b.visible) {
    b.el.style.visibility = any ? "visible" : "hidden";
    b.visible = any;
  }
}

export function updateOverlay(t: number) {
  const out = span(t, T.heroOut[0], T.heroOut[1]);
  reveal(blocks.hero, 1, out);
  const sc = 1 + 0.14 * smooth(out);
  if (blocks.hero && Math.abs(sc - heroScale) > 0.0005) {
    blocks.hero.el.style.transform = `scale(${sc.toFixed(4)})`;
    heroScale = sc;
  }
  // START A PROJECT leaves with the headline (its letters are not split, so it fades as one)
  const co = 1 - smooth(span(out, 0, 0.6));
  if (heroCta && Math.abs(co - lastCta) > 0.002) {
    heroCta.style.opacity = co.toFixed(3);
    heroCta.style.pointerEvents = co > 0.5 ? "auto" : "none";
    lastCta = co;
  }
  if (cue) {
    const c = 1 - smooth(span(t, T.cueOut[0], T.cueOut[1]));
    cue.style.opacity = c.toFixed(3);
    cue.style.visibility = c < 0.01 ? "hidden" : "visible";
  }
  const r = (k: string, i: readonly [number, number], o: readonly [number, number]) => reveal(blocks[k], span(t, i[0], i[1]), span(t, o[0], o[1]));
  r("s1", T.step1In, T.step1Out);
  r("s2", T.step2In, T.step2Out);
  r("s3", T.step3In, T.step3Out);
  r("s4", T.step4In, T.step4Out);
  r("more", T.moreIn, T.moreOut);
  r("moreSub", T.moreSubIn, T.moreOut);
  r("sv1", T.webIn, T.webOut);
  r("sv2", T.visIn, T.visOut);
  r("sv3", T.careIn, T.careOut);
  r("build", T.buildIn, T.buildOut);
  r("buildSub", T.buildSubIn, T.buildOut);
}
