/** Phones and tablets (touch, no hover). */
export const TOUCH = "(hover: none) and (pointer: coarse)";

/**
 * A photo on one of the small displays in the film. Touch devices get the small copy from
 * /images/sm: decoded, a 2400 px original costs ~35 MB, and several of them at once crash iOS
 * Safari. Larger screens keep the original. `display: contents` keeps the layout exactly as a bare img.
 */
export function TouchImg({ name, loading }: { name: string; loading?: "lazy" }) {
  return (
    <picture style={{ display: "contents" }}>
      <source media={TOUCH} srcSet={`/images/sm/${name}.jpg`} />
      <img src={`/images/${name}.jpg`} alt="" loading={loading} decoding="async" />
    </picture>
  );
}
