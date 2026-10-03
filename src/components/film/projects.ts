/** The selected work: four demo projects, each a real website, shown in this order on the desktop. */
export const PROJECTS = [
  { slug: "noir", name: "NOIR", kind: "Hair Salon / Online booking", line: "A quiet studio in the old town, booked in a minute." },
  { slug: "stack", name: "STACK", kind: "Burger Restaurant / Ordering", line: "Smash burgers, ordered ahead and picked up hot." },
  { slug: "pinnacle", name: "PINNACLE", kind: "Hotel / Booking", line: "Eleven houses above a lake, and a calendar that fills itself." },
  { slug: "vela", name: "VELA", kind: "AI / Platform", line: "An AI platform, explained on one quiet page." },
] as const;

export type ProjectSlug = (typeof PROJECTS)[number]["slug"];
export const findProject = (slug: string) => PROJECTS.find((p) => p.slug === slug);
