// The studio's look, shared by every picture of the room (the film's frames and the stills): an empty
// office after hours — the room much darker, less beige, contrasted, warm in the shadows, the glass
// frames crisp, the windows still bright — and the white table and the devices untouched, through
// a mask of "keep" polygons.
// Injected into the headless-Chrome pages of film-frames.mjs and still-screens.mjs.
(function () {
  // Tone curve (luminance in → out), monotone cubic through these points.
  const CURVE = [
    [0, 0],
    [40, 18],
    [100, 45],
    [160, 78],
    [200, 105],
    [225, 127],
    [240, 152],
    [248, 187],
    [255, 226],
  ];  const makeLut = (CURVE) => {
    const n = CURVE.length;
    const xs = CURVE.map((p) => p[0]);
    const ys = CURVE.map((p) => p[1]);
    const d = [];
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    const m = [d[0]];
    for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
    m.push(d[n - 2]);
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) {
        m[i] = m[i + 1] = 0;
        continue;
      }
      const a = m[i] / d[i];
      const b = m[i + 1] / d[i];
      const s = a * a + b * b;
      if (s > 9) {
        const t = 3 / Math.sqrt(s);
        m[i] = t * a * d[i];
        m[i + 1] = t * b * d[i];
      }
    }
    const out = new Float32Array(256);
    for (let v = 0; v < 256; v++) {
      let i = 0;
      while (i < n - 2 && v > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i];
      const t = (v - xs[i]) / h;
      const t2 = t * t;
      const t3 = t2 * t;
      out[v] = (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
    }
    return out;
  };
  const LUT = makeLut(CURVE);

  /**
   * Grades the canvas in place. keep: [{ pts: [[x, y], …] (normalised), feather?: px share of the
   * width, grow?: share of the width, refine?: true }] — inside, the picture stays exactly as it is;
   * a "refine" polygon is only a search area: inside it, the white, neutral pixels (the table's
   * edges, faces and legs) are kept, and the beige floor around them is still graded.
   */
  window.studioGrade = (ctx, W, H, keep, opts) => {
    const o = Object.assign({ feather: 0.006, grow: 0, clarity: 0.32, radius: 0.004, warm: 1.25, sat: 0.78 }, opts || {});
    const lut = o.curve ? makeLut(o.curve) : LUT;
    const src = ctx.getImageData(0, 0, W, H);
    const d = src.data;
    // the keep masks: exact areas, and search areas for the white table's own pixels
    const drawMask = (list) => {
    const mc = document.createElement("canvas");
    mc.width = W;
    mc.height = H;
    const mg = mc.getContext("2d", { willReadFrequently: true });
    mg.fillStyle = "#000";
    mg.fillRect(0, 0, W, H);
    for (const k of list) {
      const f = (k.feather ?? o.feather) * W;
      const g = (k.grow ?? o.grow) * W;
      mg.save();
      mg.filter = f > 0.3 ? "blur(" + f.toFixed(2) + "px)" : "none";
      mg.fillStyle = "#fff";
      mg.strokeStyle = "#fff";
      mg.lineJoin = "round";
      mg.beginPath();
      k.pts.forEach(([x, y], i) => (i ? mg.lineTo(x * W, y * H) : mg.moveTo(x * W, y * H)));
      mg.closePath();
      mg.fill();
      if (g > 0) {
        mg.lineWidth = g * 2;
        mg.stroke();
      }
      mg.restore();
    }
    return mg.getImageData(0, 0, W, H).data;
    };
    const m = drawMask((keep || []).filter((k) => !k.refine));
    const refineList = (keep || []).filter((k) => k.refine);
    let rm = null;
    if (refineList.length) {
      // inside the search areas: how white and neutral each pixel is, softened by a pixel
      const area = drawMask(refineList);
      const rc = document.createElement("canvas");
      rc.width = W;
      rc.height = H;
      const rg = rc.getContext("2d", { willReadFrequently: true });
      const id = rg.createImageData(W, H);
      for (let i = 0; i < d.length; i += 4) {
        if (!area[i]) continue;
        const r0 = d[i], g0 = d[i + 1], b0 = d[i + 2];
        const mx = Math.max(r0, g0, b0), mn = Math.min(r0, g0, b0);
        const sat = mx ? (mx - mn) / mx : 0;
        const L0 = 0.2126 * r0 + 0.7152 * g0 + 0.0722 * b0;
        const neutral = Math.max(0, Math.min(1, (0.112 - sat) / 0.034)) * Math.max(0, Math.min(1, (L0 - 132) / 36));
        const v = Math.round(255 * neutral * (area[i] / 255));
        id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
        id.data[i + 3] = 255;
      }
      rg.putImageData(id, 0, 0);
      const sc = document.createElement("canvas");
      sc.width = W;
      sc.height = H;
      const sg = sc.getContext("2d", { willReadFrequently: true });
      sg.fillStyle = "#000";
      sg.fillRect(0, 0, W, H);
      sg.filter = "blur(" + Math.max(0.6, W / 2400).toFixed(2) + "px)";
      sg.drawImage(rc, 0, 0);
      rm = sg.getImageData(0, 0, W, H).data;
    }
    // clarity: local contrast against a soft copy (crisper glass frames and edges)
    let b = null;
    if (o.clarity > 0) {
      const bc = document.createElement("canvas");
      bc.width = W;
      bc.height = H;
      const bg = bc.getContext("2d", { willReadFrequently: true });
      bg.filter = "blur(" + (o.radius * W).toFixed(2) + "px)";
      bg.drawImage(ctx.canvas, 0, 0);
      b = bg.getImageData(0, 0, W, H).data;
    }
    for (let i = 0; i < d.length; i += 4) {
      const keepV = rm ? Math.max(m[i], rm[i]) / 255 : m[i] / 255;
      if (keepV > 0.998) continue;
      const r0 = d[i];
      const g0 = d[i + 1];
      const b0 = d[i + 2];
      let r = r0;
      let g = g0;
      let bl = b0;
      let L = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
      if (b) {
        // limited, so a dark edge against a bright wall never grows a halo
        const Lb = 0.2126 * b[i] + 0.7152 * b[i + 1] + 0.0722 * b[i + 2];
        const delta = Math.max(-10, Math.min(10, o.clarity * (L - Lb)));
        const k = (L + delta) / Math.max(1, L);
        r *= k;
        g *= k;
        bl *= k;
        L += delta;
      }
      const Lc = Math.max(0, Math.min(255, L));
      const L2 = lut[Math.round(Lc)];
      const s = Lc > 0.5 ? L2 / Lc : 1;
      r *= s;
      g *= s;
      bl *= s;
      if (o.sat !== 1) {
        const m = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
        r = m + (r - m) * o.sat;
        g = m + (g - m) * o.sat;
        bl = m + (bl - m) * o.sat;
      }
      // warm shadows: the darker it gets, the warmer (amber in, blue out) — but blacks (bezels,
      // dark glass) stay neutral
      const lo = Math.min(1, L2 / 70);
      const w = lo * lo * (3 - 2 * lo) * Math.pow(Math.max(0, (205 - L2) / 205), 1.25) * o.warm;
      r += 12 * w;
      g += 3 * w;
      bl -= 11 * w;
      const a = 1 - keepV;
      d[i] = Math.max(0, Math.min(255, Math.round(r0 * keepV + r * a)));
      d[i + 1] = Math.max(0, Math.min(255, Math.round(g0 * keepV + g * a)));
      d[i + 2] = Math.max(0, Math.min(255, Math.round(b0 * keepV + bl * a)));
    }
    ctx.putImageData(src, 0, 0);
  };
})();
