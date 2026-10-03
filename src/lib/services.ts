/** The three services: the cards on the home page and their own pages. */
export const SERVICES = [
  {
    slug: "custom-website",
    title: "Custom website",
    line: "Unique, high-performance websites tailored to your brand.",
    visual: "site",
    intro: "A website designed around your business: structure, words, visuals and motion that make people act, built to be fast on every device.",
    includes: ["Strategy, structure and copy direction", "Custom design for desktop and mobile", "Clean, fast, scalable development", "Launch, analytics and a calm handover"],
  },
  {
    slug: "monthly-website-care",
    title: "Monthly website care",
    line: "Ongoing support, updates and improvements.",
    visual: "care",
    intro: "We keep your website fast, safe and current, and make it a little better every month, so it keeps working for you after launch.",
    includes: ["Updates, security and backups", "Monitoring and performance checks", "Content changes within days", "Monthly improvements and a short report"],
  },
  {
    slug: "visual-production",
    title: "Visual production",
    line: "High-quality visuals for your brand, products and social media.",
    visual: "frame",
    intro: "Photography, video and motion made for your brand, your products and your social channels, in the same visual language as your website.",
    includes: ["Product and brand photography", "Short video and motion pieces", "Social media content, planned and produced", "Retouching and delivery in every format"],
  },
] as const;

export type Service = (typeof SERVICES)[number];
export type ServiceSlug = Service["slug"];
export type ServiceVisual = Service["visual"];

export const findService = (slug: string) => SERVICES.find((s) => s.slug === slug);
