/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import { Alba } from "../home/sites/Alba";
import { TouchImg } from "./TouchImg";

/** Logical pixel size of each display in the devices still (aspect from the detected quads). */
export const DEVICE_SCREENS = [
  { key: "monitor", w: 1680, h: 872 },
  { key: "laptop", w: 1440, h: 878 },
  { key: "tablet", w: 1180, h: 690 },
  { key: "phone", w: 390, h: 811 },
] as const;

const REEL: [string, string, string][] = [
  ["aure-hero", "AURE", "Product · No. 04"],
  ["noir-silver", "AURE", "Campaign · Autumn"],
  ["luma-table", "NOIR", "Menu · Short film"],
  ["alba-pool", "FORMA", "Villa K · Stills"],
  ["noir-fur", "MOVEMENT", "Lookbook · AW 26"],
];

/**
 * Services: the same studio, a desk with every device. The camera finds the laptop (web
 * development), travels to the phone (visual production), then over to the tablet beside it for
 * website care. Every display is live DOM mapped onto the still; around the sharp still the room
 * carries on out of focus (devices-back: the still blurred, continued by its own mirror image).
 */
export function Devices() {
  return (
    <div className="dv" data-dv aria-hidden>
      <div className="dv-world" data-dv-world>
        <img className="dv-back" src="/film/devices-back.webp" alt="" decoding="async" />
        {/* two copies, each focused on one device; the camera's focus moves by crossfading them */}
        <div className="dv-sharp-wrap" data-dv-sharp-wrap>
          <img className="dv-sharp" data-dv-sharp="0" src="/film/devices.webp" alt="" decoding="async" />
          <img className="dv-sharp" data-dv-sharp="1" src="/film/devices.webp" alt="" decoding="async" />
        </div>
      </div>
      <div className="dv-screen dv-monitor" data-dvs="0" style={size(0)} />
      <div className="dv-screen dv-laptop" data-dvs="1" style={size(1)}>
        <div className="dv-site" data-dv-site>
          <Alba brand="FORMA" email="studio@forma.si" />
        </div>
      </div>
      <div className="dv-screen dv-tablet" data-dvs="2" style={size(2)}>
        {/* website care: the dashboard comes up on the tablet as the camera arrives */}
        <div className="dv-care" data-dv-care>
          <div className="dv-care-scale">
            <Care />
            <CareCompact />
          </div>
        </div>
      </div>
      <div className="dv-screen dv-phone" data-dvs="3" style={size(3)}>
        <div className="reel" data-reel>
          {REEL.map(([name, brand, line], i) => (
            <figure key={name} className="reel-item" data-reel-item={i}>
              <TouchImg name={name} />
              <figcaption>
                <b>{brand}</b>
                <span>{line}</span>
              </figcaption>
            </figure>
          ))}
          <div className="reel-bars">
            {REEL.map((_, i) => (
              <i key={i}>
                <b data-reel-bar={i} />
              </i>
            ))}
          </div>
        </div>
        <i className="island" />
      </div>
    </div>
  );
}

const size = (i: number): CSSProperties => ({ width: DEVICE_SCREENS[i].w, height: DEVICE_SCREENS[i].h });

/** Website care, on the tablet: what it means, at a glance — a real management dashboard. */
function Care() {
  const tick = (i: number) => <i className="cm-tick" data-tick={i} />;
  return (
    <div className="care care-full">
      <div className="care-bar">
        <span className="dots">
          <i />
          <i />
          <i />
        </span>
        <span className="care-title">Website care</span>
        <span className="care-site">
          <i />
          forma.si
        </span>
        <span className="care-ok">
          <i />
          All systems running
        </span>
        <span className="care-when">Checked 2 min ago</span>
      </div>
      <div className="care-grid">
        <section className="cm" data-cm={0}>
          <header>
            <span className="cm-k">Updates</span>
            <b className="cm-state ok">Up to date</b>
          </header>
          <ul className="cm-list">
            <li>
              {tick(0)}
              <span>CMS core 6.7</span>
              <em>today</em>
            </li>
            <li>
              {tick(1)}
              <span>Plugins · 14 of 14</span>
              <em>today</em>
            </li>
            <li>
              {tick(2)}
              <span>Theme &amp; framework</span>
              <em>this week</em>
            </li>
          </ul>
          <footer>Last update · today, 09:12</footer>
        </section>
        <section className="cm" data-cm={1}>
          <header>
            <span className="cm-k">Security</span>
            <b className="cm-state ok">Protected</b>
          </header>
          <ul className="cm-list">
            <li>
              {tick(3)}
              <span>SSL certificate</span>
              <em>valid to 2027</em>
            </li>
            <li>
              {tick(4)}
              <span>Firewall</span>
              <em>
                <b data-blocked>0</b> blocked
              </em>
            </li>
            <li>
              {tick(5)}
              <span>Malware scan</span>
              <em>clean</em>
            </li>
          </ul>
          <footer>Monitored around the clock</footer>
        </section>
        <section className="cm" data-cm={2}>
          <header>
            <span className="cm-k">Backups</span>
            <b className="cm-state">Daily · 30 kept</b>
          </header>
          <div className="cm-dots">
            {Array.from({ length: 14 }, (_, i) => (
              <i key={i} data-bk={i} />
            ))}
          </div>
          <div className="cm-row">
            <span>Last backup</span>
            <b>Today, 03:00</b>
          </div>
          <footer className="cm-actions">
            <span className="cm-btn">Restore</span>
            <span className="cm-btn ghost">Download</span>
          </footer>
        </section>
        <section className="cm cm-perf" data-cm={3}>
          <header>
            <span className="cm-k">Performance</span>
          </header>
          <div className="cm-score">
            <svg viewBox="0 0 120 120" aria-hidden>
              <circle cx="60" cy="60" r="50" className="bg" />
              <circle cx="60" cy="60" r="50" className="fg" pathLength={100} data-score-ring />
            </svg>
            <b data-score-num>0</b>
          </div>
          <div className="cm-metrics">
            <div>
              <span>Load time</span>
              <b>0.8 s</b>
            </div>
            <div>
              <span>Uptime</span>
              <b>99.99 %</b>
            </div>
            <div>
              <span>Core vitals</span>
              <b>Good</b>
            </div>
          </div>
        </section>
        <section className="cm" data-cm={4}>
          <header>
            <span className="cm-k">Content changes</span>
            <b className="cm-state">3 this month</b>
          </header>
          <ul className="cm-tasks">
            {[
              ["New spring menu page", 0],
              ["Opening hours updated", 1],
              ["Homepage campaign banner", 2],
            ].map(([label, i]) => (
              <li key={label} data-cc={i}>
                <span>{label}</span>
                <em className="todo">In progress</em>
                <em className="done">Done</em>
                <i className="cm-bar">
                  <b data-ccbar={i} />
                </i>
              </li>
            ))}
          </ul>
        </section>
        <section className="cm" data-cm={5}>
          <header>
            <span className="cm-k">Technical support</span>
            <b className="cm-state">Avg. reply 2 h</b>
          </header>
          <div className="cm-ticket">
            <span className="cm-av">K</span>
            <div>
              <b>#142 · Contact form e-mails</b>
              <span>“Fixed — the form now sends to both inboxes.”</span>
            </div>
            <em className="cm-solved" data-solved>
              Solved
            </em>
          </div>
          <div className="cm-ask">Ask your codERA team anything…</div>
        </section>
      </div>
    </div>
  );
}

/** The same dashboard for a phone in the hand: six big tiles that read from arm's length. */
function CareCompact() {
  const tiles: [string, string][] = [
    ["Updates", "Up to date"],
    ["Security", "Protected"],
    ["Backups", "Daily"],
    ["Speed", "98 / 100"],
    ["Changes", "3 done"],
    ["Support", "Reply in 2 h"],
  ];
  return (
    <div className="care care-compact">
      <div className="cc-bar">
        <span>Website care</span>
        <b>
          <i />
          All good
        </b>
      </div>
      <div className="cc-grid">
        {tiles.map(([k, v], i) => (
          <section key={k} className="cm cc-tile" data-cm={i}>
            <span className="cc-k">
              <i className="cm-tick" data-tick={i} />
              {k}
            </span>
            <b className="cc-v">{v}</b>
          </section>
        ))}
      </div>
    </div>
  );
}
