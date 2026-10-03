/** Contact details as shown in the reference; replace with the real ones when they change. */
export const PHONE = { display: "+386 41 123 456", href: "tel:+38641123456" };
export const EMAIL = "info@cod-era.com";

export function Contact() {
  return (
    <section className="sec contact" id="contact" aria-labelledby="contact-h">
      <span className="eyebrow contact-eyebrow">Contact</span>
      <h2 id="contact-h" className="contact-title">Let’s build something.</h2>
      <p className="contact-line">Have a project in mind?</p>
      <div className="contact-links">
        <a href={PHONE.href}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M6.6 3h3l1.6 4.2-2 1.4a12 12 0 0 0 6.2 6.2l1.4-2 4.2 1.6v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.2 2 2 0 0 1 6.6 3z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
          {PHONE.display}
        </a>
        <a href={`mailto:${EMAIL}`}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <rect x="3" y="5.5" width="18" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="M3.5 7l8.5 6 8.5-6" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          {EMAIL}
        </a>
      </div>
    </section>
  );
}
