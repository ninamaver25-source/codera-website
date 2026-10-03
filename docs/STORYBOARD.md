# codERA — "One Take"  ·  cinematic storyboard & scroll timeline

One continuous shot. The scrollbar is the timeline of a 20-unit film (1 unit = 100 vh of
scroll on desktop, 82 vh on phones). One photorealistic 16" laptop is the protagonist: it opens
the film, we enter it, we live inside it, we pull back out of it, and it closes the film with
the booking.

World units: 1 unit = 10 cm. Ground = y 0. Camera fov 30° (vertical) unless stated.
The numbers below are the ones in `src/components/cinema/storyboard.ts`.

## The object

| Part | Size (w × h × d) | Notes |
|---|---|---|
| Base | 3.56 × 0.155 × 2.48 | satin anodised aluminium (brushed anisotropy), recessed matte keyboard well with 79 instanced keycaps, trackpad in a machined groove, two ports |
| Lid | 3.56 × 2.40 × 0.075 | aluminium back, black-glass front, hinge barrel on the rear edge of the base at (0, 0.155, −1.20) |
| Display | 3.30 × 2.0625 (16:10) | live DOM surface (1440 × 900 css px), chin 0.19, top bezel 0.15, camera dot |
| Lid angle θ | 0° closed → 100° open | lid.rotation.x = 90° − θ. At 100° the screen normal tilts up 10°; screen centre = (0, 1.365, −1.375) |

Studio: warm cream cyclorama (background + fog), a baked softbox environment (top softbox,
tall key panel front-left, cool rim panel back-right, warm bounce behind the lens), warm key
directional with VSM soft shadows, cool rim, hemisphere fill, contact shadow, satin reflective
floor. The display lights the keyboard with a rect-area light as its brightness rises.

## Palette

cream `#f1ece3` · warm white `#f7f3ec` · stone `#ddd5c8` · haze `#e6dfd3` · taupe `#9b9084`
· graphite `#2a2622` · set black `#1a1714` · ink `#15130f`. Champagne appears only as light on
metal and glass.

## Timeline (desktop, landscape)

| Stage | Units | Camera position → | Camera target → | Laptop (lid θ) | Light | Text | Transition |
|---|---|---|---|---|---|---|---|
| **01 Arrival** | 0.0 – 1.0 | (0, 2.9, 10.2) → (0, 2.85, 9.9) slow drift | (0, 0.3, 0.1) | closed, 0° | key 2.0 warm at (−4, 9, 6), cool rim, cream cyc | `codERA · websites & visual production` · `WE CREATE / WEBSITES & VISUALS.` · `Digital experiences built to stand out.` (in from the start, gone by 1.25) | the lid begins to move at 1.1 |
| **02 The laptop opens** | 1.0 – 3.0 | → (−2.6, 2.65, 7.7) lateral + closer | → (−1.0, 1.05, −0.9) | 0° → 100° (power2.inOut over 1.1 – 2.9) | key slides (−4, 9, 6) → (−5.5, 7, 3) so highlights travel over the metal; the display's rect light warms the keys as brightness rises | `EVERY GREAT / WEBSITE / STARTS BLANK.` left of the laptop, 2.3 – 3.45 | brightness 0 → 1 mapped from θ 55° → 95°; the display stays empty |
| **03 Build the website** | 3.0 – 6.0 | → perpendicular to the display at d 6.2 by 3.7, slow push to d 5.6 | screen centre | 100° | steady studio | captions `01 — Typography` … `07 — Final polish` bottom-left, one per step | the ALBA site assembles inside the display: type 3.2 – 3.6, nav 3.6 – 3.95, layout 3.95 – 4.4, imagery 4.4 – 4.85, UI 4.85 – 5.25, motion 5.25 – 5.65 (cursor → Reserve, hover, page scroll), polish 5.65 – 5.95 |
| **04 Enter the screen** | 6.0 – 7.5 | dolly along the screen normal d 5.6 → d_fill (7.25) → −0.4 (7.5) | screen centre | 100° | cyc fades to stone haze 7.2 – 7.5 | none | the display covers the viewport at 7.25 (d_fill = min over height/width for the live aspect), the site dissolves 7.27 – 7.46, the camera passes the glass; cut on a flat haze frame |
| **05 Project world** | 7.5 – 11.5 | (0, 0, 21) → (0.8, 0.1, 10) → (−0.6, −0.1, 0.5) → (0.4, 0.1, −8.5) → (0.2, 0.15, −13.5), then dolly into D's hero image 10.9 – 11.5 | ahead with a gentle sway, then D's image | (world hidden) | dense warm haze, white-box environment, no floor | `PROJECTS THAT / MAKE AN IMPACT.` 7.62 – 8.4; a fixed-size label under each display | A LUMA (−4.6, 0.4, 6) rotY 16°, w 5.2 · B VELA (4.4, −0.2, −3) rotY −18°, w 4.8 · C NOIR (−2.8, 0.9, −12) rotY 9°, w 5.6 · D AURE (0, 0.1, −22), w 6.4. Each site scrolls inside its display as the camera nears it; displays veil with distance (clear within 7, gone at 18) |
| **06 Visual production** | 11.5 – 14.5 | plain packshot (0, 1.35, 10.8), fov matched to the square hero image → low ¾ (−4.8, 1.0, 7.6) fov 28 → (−3.6, 1.2, 6.2) fov 30 | (0, 1.35, 0) → (0, 1.3, 0) → (0.3, 1.3, −0.5) | — | white box → dark set 11.9 – 13.6: hemi 1.35 → 0.06, key spot 0 → 900, rim 0 → 520, warm/cool strip softboxes fade in, black cards for edge definition, backdrop and floor cream → near-black, floor mirror 0 → 0.8 | `FROM THIS.` 11.6 – 12.2 · `TO THIS.` 13.3 – 13.95 · `VISUAL PRODUCTION / THAT MAKES PRODUCTS / IMPOSSIBLE TO IGNORE.` 13.95 – 14.75 (text flips to warm white 12.1 – 13.2) | D's hero image is a 1000 × 1000 render of this very set in its plain state; a full-viewport copy of it covers the cut at 11.5 and fades over 0.22 units onto the live bottle |
| **07 Services** | 14.5 – 16.5 | forward past the bottle (−1.2, 1.25, 1.0) → (−0.5, 1.3, −17) → (−0.45, 1.3, −18.2) | ahead | — | set stays dark for 01 and 02, brightens 15.65 – 16.1, haze thickens 15.9 – 16.55 until only colour remains | `01 CUSTOM WEBSITES` at z −6 · `02 VISUAL PRODUCTION` at z −13 · `03 MONTHLY WEBSITE CARE` at z −20, each with its one line; visible within 12 units, gone once passed, all faded by 16.55 | typography at three depths; text tone flips light → ink 15.75 – 16.05 |
| **08 Return to reality** | 16.5 – 18.5 | cut at 16.6 to d_fill·0.82 in front of the display; pull back along the normal to d 4.6 (17.6), then arc down to (0, 2.15, 8.6) | screen centre → (0, 1.0, −0.3) | 100° | studio returns 16.6 – 17.0 | none | the haze we were inside is the display's content; the bezel, the laptop and the desk reveal themselves; full circle |
| **09 Final shot** | 18.5 – 20.0 | (0, 1.95, 8.2) → d 6.0 in front of the display | (0, 1.05, −0.4) → screen centre | 100° | soft warm studio, slightly above desk level | display: `READY TO / BUILD YOURS?` + `Book a Call` 18.3 – 19.5; booking interface (calendar, available dates, times, confirm) from 19.32; `See you soon. · codERA © 2026 · hello@codera.studio` inside the display | end of film |

Cinematic easing: camera keys use power2.inOut between holds and linear travel inside the
inner world; the lid uses power2.inOut; text uses short power2.out fades. Every transition
shares at least 0.2 units where the outgoing and incoming states coexist.

## Mobile (portrait) choreography — same story, re-framed

* Studio keys are pushed back by `(1.5 / aspect)^0.55` and lifted so the laptop sits low in the
  tall frame; the headline stacks in three lines above it.
* 02: the laptop opens centred (lateral sway reduced to 30 %); the blank-screen line sits above.
* 03 – 04: the camera reads the display from 15.5 / 14.2 units so it fills the phone's width,
  then the enter-dolly is computed from the live aspect (the display fills the height).
* 05: the four displays sit on the path, alternating above and below the lens (w 1.9 / 1.8),
  each filling the width as the camera reaches it and sliding out vertically — projects become
  vertical. Labels are centred under each display.
* 06 – 07: identical set; services sit on the axis in a narrower, centred block.
* 08 – 09: the laptop returns; the display is read from 12.5 / 14.6 units; the booking uses a
  2.2× zoomed compact layout so dates and times stay legible and tappable.
* Reduced 3D: no soft VSM radius cost beyond the map, no floor reflection, no post-processing,
  static environment map, simplified glass (physical transmission), dpr ≤ 1.5.

## Performance plan

* Opening loads only the laptop, the baked environment and the ALBA site (no HDRI download).
* The inner world (project sites, bottle, services) is a lazy import triggered when scroll
  progress passes 3.5 units or after 4.5 s idle.
* Photography is served from `/public/images` (Pexels placeholders), decoded lazily.
* The renderer runs on demand: frames are produced only while the scroll progress is settling.
* Every drei `Html` renders into one stable portal element so React roots are never recreated.
