/**
 * The film's clock. Scroll position through the pinned track is the only input: `t` is measured
 * in viewport heights (0 … TOTAL). Nothing in the film is time-based; every visual is a pure
 * function of `t`, so scrolling forward plays the film and scrolling back rewinds it exactly.
 */

/** Length of the film in viewport heights of scroll. */
export const TOTAL = 32.4;

export const film = {
  t: 0,
  p: 0,
  set(p: number) {
    this.p = p < 0 ? 0 : p > 1 ? 1 : p;
    this.t = this.p * TOTAL;
  },
};

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
/** 0 → 1 as t travels from a to b (clamped, linear). */
export const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const smooth = (u: number) => u * u * (3 - 2 * u);
export const sine = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * u);
export const cubicOut = (u: number) => 1 - Math.pow(1 - u, 3);
/** 0 → 1 → 0: in over [a, b], out over [c, d]. */
export const window4 = (t: number, a: number, b: number, c: number, d: number) => smooth(span(t, a, b)) * (1 - smooth(span(t, c, d)));

type R = readonly [number, number];

/* ------------------------------------------------------------------ */
/*  The timeline (viewport heights of scroll)                            */
/* ------------------------------------------------------------------ */

export const T = {
  /* ---------- Chapter one: the laptop ---------- */
  // 01 Intro: the words sit in the studio from the first frame, then dissolve as the camera moves
  heroOut: [0.04, 0.8] as R,
  cueOut: [0.02, 0.2] as R,
  // 02 Into the studio (clip 1) — nothing to read, so it moves briskly
  clip1: [0.1, 1.6] as R,
  // 03 The closed laptop, YOUR IDEA
  step1In: [1.7, 2.2] as R,
  // 04 The lid opens (clip 2), the display wakes
  clip2: [2.4, 3.6] as R,
  screenOn: [3.2, 3.6] as R,
  idea: [3.5, 4.8] as R,
  step1Out: [4.4, 4.75] as R,
  // 05 Design
  toDesign: [4.7, 5.0] as R,
  step2In: [4.9, 5.35] as R,
  layout: [5.2, 5.7] as R,
  type: [5.7, 6.2] as R,
  images: [6.2, 6.7] as R,
  polish: [6.7, 7.2] as R,
  step2Out: [7.2, 7.55] as R,
  // 06 Development
  toDev: [7.5, 7.8] as R,
  step3In: [7.7, 8.15] as R,
  dev: [7.9, 9.7] as R,
  step3Out: [9.7, 10.05] as R,
  // 07 Launch
  toLaunch: [10.0, 10.3] as R,
  step4In: [10.25, 10.7] as R,
  launch: [10.45, 12.3] as R,
  step4Out: [12.3, 12.6] as R,
  // 08 Launch done: the display sleeps and the lid closes, smoothly and without ceremony
  screenOff: [12.45, 12.75] as R,
  close: [12.7, 13.6] as R,
  // 09 The camera steps back into the studio (clip 1 backwards)
  retreat: [13.6, 14.8] as R,

  /* ---------- Chapter two: more than websites ---------- */
  // Every move finishes before the next begins: the words leave, then the camera moves, then the
  // next words arrive.
  moreIn: [14.0, 14.7] as R,
  moreSubIn: [14.4, 14.9] as R,
  moreOut: [15.6, 16.0] as R,
  // Services: the same desk, now with every device; one camera
  svcIn: [16.0, 16.7] as R,
  toWeb: [16.75, 17.35] as R,
  webIn: [17.35, 17.8] as R,
  webScroll: [17.4, 19.0] as R,
  webOut: [18.9, 19.25] as R,
  toPhone: [19.25, 19.95] as R,
  visIn: [19.95, 20.4] as R,
  visPlay: [20.05, 21.85] as R,
  visOut: [21.75, 22.1] as R,
  // from the phone the camera moves over to the tablet: website care
  toCare: [22.1, 23.2] as R,
  careIn: [23.2, 23.7] as R,
  carePlay: [23.4, 25.4] as R,
  careOut: [25.3, 25.65] as R,
  // website care is over: the devices go out of focus and the camera draws back into the room
  careExit: [25.65, 26.3] as R,

  /* ---------- Chapter three: now, let's build yours ---------- */
  // the room comes back into focus, the camera easing back from the desk
  roomBack: [25.9, 26.8] as R,
  buildIn: [27.0, 27.7] as R,
  buildSubIn: [27.4, 27.9] as R,
  buildOut: [28.9, 29.3] as R,
  // through the room toward the workstation: the computer appears, out of focus, then sharp
  toDesk: [29.3, 30.1] as R,
  // the camera comes slowly up to the screen until the price generator reads comfortably …
  approach: [30.2, 31.7] as R,
  // … and stays there: the end of the film, the generator is the visitor's
  end: 32.4,
};

/** What is left of the old work scene: the desk with the computer arrives over SCENE.in. */
export const SCENE = { in: 0.6 };

/** Where the in-page links land. */
export const JUMP: Record<string, number> = {
  top: 0,
  process: T.step1In[1] + 0.05,
  services: T.webIn[1] + 0.1,
  // the price generator, ready
  work: T.end,
  project: T.end,
};
