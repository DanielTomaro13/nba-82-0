/**
 * Cross-site strip linking every project in the "0 Series". The same bar lives
 * on each sibling so all of them point at one another. MarketMover sits at the
 * end as a cross-promo (mark + name), separate from the series list.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type Site = {
  key: string;
  label: string;
  href: string;
  mark?: string;
};

const SITES: Site[] = [
  { key: "afl", label: "AFL 23-0", href: "https://afl23-0.com" },
  { key: "nrl", label: "NRL 24-0", href: "https://nrl24-0.com" },
  { key: "nba", label: "NBA 82-0", href: "https://nba82-0.com" },
  { key: "nbl", label: "NBL 33-0", href: "https://nbl33-0.com" },
  { key: "mlb", label: "MLB 162-0", href: "https://mlb162-0.com" },
  { key: "football", label: "Football Invincibles", href: "https://footballinvincibles.com" },
  { key: "f1", label: "F1 Slam", href: "https://f1slam.com" },
  { key: "tennis", label: "Tennis Slam", href: "https://grandtennisslam.com" },
  {
    key: "marketmover",
    label: "MarketMover",
    href: "https://www.marketmover.net?utm_source=nba82-0&utm_medium=sister_bar&utm_campaign=crosspromo",
    mark: `${BASE}/marketmover-mark.png`,
  },
];

function SiteLabel({ site }: { site: Site }) {
  if (!site.mark) return site.label;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <img
        src={site.mark}
        alt=""
        width={16}
        height={16}
        style={{ width: 16, height: 16, borderRadius: 4, display: "block", flexShrink: 0 }}
      />
      {site.label}
    </span>
  );
}

export default function SisterSites({ active }: { active: string }) {
  return (
    <div style={{ background: "#04080699", borderBottom: "1px solid var(--border)" }}>
      <div className="sister-bar" role="navigation" aria-label="Sister sites" style={{ borderBottom: "none" }}>
        <span style={{ color: "var(--muted)", marginRight: 2, fontWeight: 700, fontSize: ".7rem" }}>
          THE 0 SERIES ·
        </span>
        {SITES.map((s) => (
          <span key={s.key} style={{ display: "inline-flex", alignItems: "center" }}>
            {s.mark ? (
              <span aria-hidden="true" style={{ width: 1, alignSelf: "stretch", background: "var(--border)", margin: "3px 6px" }} />
            ) : null}
            {s.key === active ? (
              <span className="sister-link" data-active="true" aria-current="page"><SiteLabel site={s} /></span>
            ) : (
              <a className="sister-link" href={s.href}><SiteLabel site={s} /></a>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
