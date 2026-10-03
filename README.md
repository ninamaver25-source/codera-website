# codERA — one continuous film through a dark premium office, scrubbed by scroll

From the first screen to the last, the page is one room: a dark architectural office after hours —
warm charcoal walls, dark walnut, cognac leather, amber light and a little daylight from the
window. The headline (WE BUILD DIGITAL / EXPERIENCES., the three services and START A PROJECT)
sits on the empty wall above the chair; the camera walks to the desk where a laptop tells the four
steps of a project (idea, design, development, launch — each title standing on the desk's far
edge, its line on the desk); the camera steps back (WE BUILD MORE THAN WEBSITES.) and finds a desk
holding every device: web development, visual production, website care. When website care is
over the camera draws back into the room: NOW, LET'S BUILD YOURS. Then it moves toward the
workstation; the computer comes into focus and the camera comes slowly up to its screen, where it
stops: the AI PRICE GENERATOR is the end of the site (one box — describe the project, tick a few
options, GET MY ESTIMATE, SEND PROJECT REQUEST), with a one-line footer under it. The plan is in
[docs/PLAN.md](docs/PLAN.md).

## Run

```bash
npm run dev -- -p 3001
```

Open http://localhost:3001. `?p=0.42` jumps to 42 % of the film (stills, reviews);
`#process`, `#services`, `#work` / `#project` (the price generator) open a scene.

Copy `.env.example` to `.env.local` for the inquiry e-mail:

* `RESEND_API_KEY` (+ `INQUIRY_TO`, `INQUIRY_FROM` on a domain verified in Resend) sends the
  project e-mail. Without it, development prints the e-mail to the server log; production refuses.
* `ANTHROPIC_API_KEY` (+ `ANTHROPIC_MODEL`) lets Claude read the descriptions typed into the
  price generator. Without it a keyword reader (English and Slovenian) picks the services. Either
  way the AI only picks options; every price comes from the rules in `src/lib/configurator`
  (`catalog.ts` holds the studio's price list, `brief.ts` the options and how they map onto it).

## Languages

English first, then Slovenian, French, Spanish, German and Croatian — the menu at the top right
(`LangSwitch.tsx`). Every word of the site is in `src/components/film/i18n.ts` (one dictionary per
language); the choice is remembered in the browser, and `?lang=sl` (fr, es, de, hr) opens a
language directly. Headlines shrink a little where a language runs longer (`--k`). The props on the
screens (the website on the laptop, the design tool, the care dashboard) stay in English, like real
products. The price generator reads a description in any of the six languages (Claude, or the
keyword reader in `brief.ts`), says back what it understood in the visitor's language
(`locale.ts`) and writes prices the local way; the e-mail to the studio stays in English and names
the visitor's language.

## How it is built

* **One clock** (`src/components/film/time.ts`): scroll through a 32-viewport track is the film
  time `t`; every scene is a pure function of `t`. Lenis smooths the wheel; one
  `requestAnimationFrame` loop updates every layer from the same `t`. Each move finishes before the
  next begins (words out → camera → words in). The film ends on the computer; nothing follows.
* **Footage** (`player.ts`): two AI clips of the office (the approach; the lid opening) as a WebP
  sequence on a canvas (at most 1.5 × the CSS size on larger screens, 1.25 × on phones — the
  footage is 1600 px wide), paced by motion energy. One locked framing (`layout()`, from the
  `LAPTOP` box measured in the footage) from 01 to 04; the words of each step stand on the desk's
  far edge (`DESK_LINE`; phones: above the laptop, all four ending on the same line). Where the
  room hands over to a desk (or comes back from one) it goes out of focus by laying a tiny copy of
  the frame over it (no CSS filter).
* **The laptop's screen** (`screen/`): a live 1440 × 900 DOM display mapped onto the tracked
  green-screen corners with `matrix3d`.
* **Devices** (`Devices.tsx`, `devicesUpdate.ts`): one 4K still of a desk with a monitor, the
  laptop, a tablet and a phone; a digital camera travels between them, every display is live DOM.
  Rack focus without redrawing masks while moving: two copies of the still with a fixed focus each,
  crossfaded (phones: no focus masks). The desk arrives at the footage's desk height; every picture
  is decoded ahead (`warm`); style writes only when something changed.
* **The end: the AI price generator on the computer** (`Work.tsx`, `workUpdate.ts`,
  `PriceGenerator.tsx`, `priceStore.ts`): after NOW, LET'S BUILD YOURS. the computer comes into
  focus and the camera comes up to the screen (`closeUp`: on larger screens the display nearly
  fills the frame; on phones the generator's 440 × 700 column fills the width) and stops. The
  screen is the generator — interactive, nothing around it: write → GET MY ESTIMATE (the AI reads
  the description via `POST /api/interpret` and ticks the options it implies) → SEND PROJECT
  REQUEST (name, email, company and a message, both optional, in the same box) → PROJECT RECEIVED.
  `brief.ts` (options, prices, keyword reader, the AI's sentence), `model.ts` (Claude), `email.ts`,
  `POST /api/inquiry` (re-computes the estimate on the server, honeypot, rate limit).
* **The look**: the room is generated in that look: `film-src/office` holds the five approved
  stills, the clips are in `film-src/clips-office`. Type: Montserrat (light + bold) for
  headlines, Geist for text; ivory on warm charcoal, amber as the only accent.

## Tooling

* `node scripts/film-frames.mjs --fps 24 --width 1600 --quality 0.72 --nokey 0 --out public/film film-src/clips-office/v1.mp4 film-src/clips-office/v2.mp4`
  decodes the clips in Chrome, tracks the green display, replaces it with glass and removes spill
  (`--nokey 0`: the approach has no display, so it is written exactly as generated).
* `node scripts/still-screens.mjs --width 3840 --quality 0.88 --glass dark --out public/film/devices film-src/office/devices.png`
  finds every display in a still and writes the cleaned still and its corners (the desktop:
  `--out public/film/work-1 film-src/office/desk.png`).
* `node scripts/backdrop.mjs --width 1200 --blur 7 --out public/film/devices-back public/film/devices.webp`
  (the desktop: `--width 960 --blur 6`) makes the soft room around a still.
* `scripts/grade.js` and `scripts/table-track.mjs` belong to the earlier light studio (the white
  table was kept out of a darkening grade); its sources are still in `film-src/light`,
  `film-src/clips-light`, `film-src/work`, `film-src/burger`.

## Structure

```
src/app/                        layout, page (the film), api/interpret, api/inquiry, work/[slug] and services/[slug] (older pages), mock/[site]
src/components/film/            Film · time · player · Overlay · Devices · Work · PriceGenerator · priceStore · screen/
src/lib/configurator/           catalog (prices) · brief (the generator) · model (Claude) · email · estimate (earlier)
src/components/home/sites/      the client website mock-ups (AURE, FORMA/Alba, the reel …)
public/film/                    frames, manifest, devices still, the desktop still, their soft backdrops
legacy/                         earlier directions, kept for reference
```
