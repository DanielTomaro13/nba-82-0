/**
 * Cross-site strip linking the four sister projects (the "0 Series"), plus a
 * contextual cross-promo line. The same bar lives on AFL 23-0, NRL 24-0 and
 * Football Invincibles so all four sites point at one another.
 */
const SITES = [
  { key: "afl", label: "AFL 23-0", href: "https://afl23-0.com" },
  { key: "nrl", label: "NRL 24-0", href: "https://nrl24-0.com" },
  { key: "nba", label: "NBA 82-0", href: "https://nba82-0.com" },
  { key: "football", label: "Football Invincibles", href: "https://footballinvincibles.com" },
];

const PROMO: Record<string, { emoji: string; text: string; label: string; href: string }> = {
  nba: { emoji: "🏉", text: "Into footy or league? Try →", label: "AFL 23-0 · NRL 24-0", href: "https://afl23-0.com" },
  nrl: { emoji: "🏀", text: "Into the NBA? Try the basketball version →", label: "NBA 82-0", href: "https://nba82-0.com" },
  football: { emoji: "🏀", text: "Into hoops, footy or league? Try →", label: "NBA 82-0 · AFL 23-0", href: "https://nba82-0.com" },
  afl: { emoji: "🏀", text: "Into the NBA? Try →", label: "NBA 82-0", href: "https://nba82-0.com" },
};

export default function SisterSites({ active }: { active: "afl" | "nrl" | "nba" | "football" }) {
  const promo = PROMO[active];
  return (
    <div style={{ background: "#04080699", borderBottom: "1px solid var(--border)" }}>
      <div className="sister-bar" role="navigation" aria-label="Sister sites" style={{ borderBottom: "none" }}>
        <span style={{ color: "var(--muted)", marginRight: 2, fontWeight: 700, fontSize: ".7rem" }}>
          THE 0 SERIES ·
        </span>
        {SITES.map((s) =>
          s.key === active ? (
            <span key={s.key} className="sister-link" data-active="true" aria-current="page">{s.label}</span>
          ) : (
            <a key={s.key} className="sister-link" href={s.href}>{s.label}</a>
          )
        )}
      </div>
      {promo && (
        <div style={{ textAlign: "center", fontSize: ".74rem", padding: "3px 0.6rem 5px", color: "var(--muted)" }}>
          <span style={{ marginRight: 6 }}>{promo.emoji}</span>
          {promo.text}{" "}
          <a href={promo.href} style={{ color: "var(--accent)", fontWeight: 700 }}>{promo.label}</a>
        </div>
      )}
    </div>
  );
}
