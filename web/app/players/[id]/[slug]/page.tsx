import { notFound } from "next/navigation";
import Link from "next/link";
import { pageMeta, breadcrumbJsonLd, SITE } from "@/lib/seo";
import { notablePlayers, playerById } from "@/lib/playerdb";
import { clubColors } from "@/lib/clubs";
import { POS_GROUP } from "@/lib/format";
import JsonLd from "@/components/JsonLd";

export const dynamicParams = false;

export function generateStaticParams() {
  return notablePlayers().map((p) => ({ id: String(p.id), slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id } = await params;
  const p = playerById(id);
  if (!p) return {};
  return pageMeta({
    title: `${p.name} — NBA profile, stats & rating`,
    description: `${p.name}: ${p.posName} for the ${p.club}. ${p.apps} NBA games, ${p.pts} PPG, ${p.firstYear}–${p.lastYear}. All-time NBA 82-0 rating ${p.rating}.`,
    path: `/players/${p.id}/${p.slug}`,
    keywords: [p.name, "NBA", p.club, p.posName, "stats", "rating"],
  });
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id } = await params;
  const p = playerById(id);
  if (!p) notFound();
  const [c1, c2] = clubColors(p.club);

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    jobTitle: `${p.posName} (basketball)`,
    affiliation: { "@type": "SportsTeam", name: p.club },
    url: `${SITE.url}/players/${p.id}/${p.slug}`,
  };
  const stat = (label: string, value: string | number) => (
    <div style={{ padding: ".7rem .9rem", background: "var(--panel-2)", borderRadius: 10, textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-cond)", fontSize: "1.5rem" }}>{value}</div>
      <div style={{ fontSize: ".66rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
    </div>
  );

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <JsonLd data={personLd} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Players", path: "/players" }, { name: p.name, path: `/players/${p.id}/${p.slug}` }])} />
      <nav style={{ fontSize: ".82rem" }}><Link href="/players" style={{ color: "var(--accent)" }}>← All players</Link></nav>
      <header className="card" style={{ padding: "1.25rem", borderTop: `3px solid ${c1}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "2rem" }}>{p.name}</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, color: "var(--muted)" }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: c1, border: `1px solid ${c2}` }} />
              {p.club} · {p.posName} · {POS_GROUP[p.pos]}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-cond)", fontSize: "3rem", lineHeight: 1, color: p.rating >= 90 ? "var(--gold)" : "var(--text)" }}>{p.rating}</div>
            <div style={{ fontSize: ".66rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>82-0 rating</div>
          </div>
        </div>
      </header>
      <div style={{ fontSize: ".7rem", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)" }}>Per game</div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill,minmax(96px,1fr))" }}>
        {stat("PPG", p.pts)}
        {stat("RPG", p.reb)}
        {stat("APG", p.ast)}
        {stat("SPG", p.stl)}
        {stat("BPG", p.blk)}
        {p.mpg ? stat("MPG", p.mpg) : null}
      </div>
      <div style={{ fontSize: ".7rem", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)" }}>Shooting &amp; career</div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill,minmax(96px,1fr))" }}>
        {p.fgPct ? stat("FG%", `${p.fgPct}`) : null}
        {p.fg3Pct ? stat("3P%", `${p.fg3Pct}`) : null}
        {p.ftPct ? stat("FT%", `${p.ftPct}`) : null}
        {p.fg3 ? stat("3PM", p.fg3) : null}
        {stat("Games", p.apps)}
        {stat("Span", `${p.firstYear}–${p.lastYear}`)}
      </div>
      <p style={{ color: "var(--muted)", fontSize: ".88rem", lineHeight: 1.6 }}>
        {p.name} is rated <strong style={{ color: "var(--text)" }}>{p.rating}</strong> in NBA 82-0 — built from {p.apps} games of real
        NBA box-score data ({p.firstYear}–{p.lastYear}): {p.pts} points, {p.reb} rebounds and {p.ast} assists a game
        {p.fgPct ? ` on ${p.fgPct}% shooting` : ""}. {" "}
        <Link href="/play" style={{ color: "var(--accent)" }}>Draft {p.name.split(" ")[0]} into your perfect team →</Link>
      </p>
    </div>
  );
}
