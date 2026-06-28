import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";
import { allPlayers } from "@/lib/playerdb";
import { allTeams } from "@/lib/teamdb";
import { allMatchIds } from "@/lib/matchdb";

export const dynamic = "force-static";

// WNBA datasets may be absent (pipeline not yet run): guard every data-driven
// loader so a missing dataset never breaks sitemap generation.
const safe = <T>(fn: () => T[]): T[] => { try { return fn(); } catch { return []; } };

const GAMES = [
  "footle", "guess-the-player", "draft-class", "higher-or-lower",
  "efficiency-duel", "bracket-challenge", "career-path", "beat-the-clock", "score-predictor",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const top: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, priority: 1, changeFrequency: "weekly", lastModified: now },
    { url: `${SITE.url}/play/`, priority: 0.9, changeFrequency: "weekly", lastModified: now },
    { url: `${SITE.url}/games/`, priority: 0.8, changeFrequency: "weekly", lastModified: now },
    { url: `${SITE.url}/ladder/`, priority: 0.8, changeFrequency: "daily", lastModified: now },
    { url: `${SITE.url}/playoffs/`, priority: 0.8, changeFrequency: "daily", lastModified: now },
    { url: `${SITE.url}/teams/`, priority: 0.8, changeFrequency: "weekly", lastModified: now },
    { url: `${SITE.url}/players/`, priority: 0.8, changeFrequency: "weekly", lastModified: now },
    { url: `${SITE.url}/fixtures/`, priority: 0.7, changeFrequency: "daily", lastModified: now },
    { url: `${SITE.url}/stats/`, priority: 0.7, changeFrequency: "weekly", lastModified: now },
    { url: `${SITE.url}/compare/`, priority: 0.6, changeFrequency: "weekly", lastModified: now },
    { url: `${SITE.url}/glossary/`, priority: 0.5, changeFrequency: "monthly", lastModified: now },
    { url: `${SITE.url}/leaderboard/`, priority: 0.6, changeFrequency: "daily", lastModified: now },
    { url: `${SITE.url}/about/`, priority: 0.5, changeFrequency: "monthly", lastModified: now },
    { url: `${SITE.url}/contact/`, priority: 0.4, changeFrequency: "yearly", lastModified: now },
    { url: `${SITE.url}/privacy/`, priority: 0.3, changeFrequency: "yearly", lastModified: now },
    { url: `${SITE.url}/terms/`, priority: 0.3, changeFrequency: "yearly", lastModified: now },
  ];
  const games: MetadataRoute.Sitemap = GAMES.map((g) => ({
    url: `${SITE.url}/games/${g}/`,
    priority: 0.7,
    changeFrequency: "weekly",
    lastModified: now,
  }));
  const players: MetadataRoute.Sitemap = allPlayers().map((p) => ({
    url: `${SITE.url}/players/${p.id}/${p.slug}/`,
    priority: 0.5,
    changeFrequency: "weekly",
    lastModified: now,
  }));
  const teams: MetadataRoute.Sitemap = allTeams().map((t) => ({
    url: `${SITE.url}/teams/${t.abbr.toLowerCase()}/`,
    priority: 0.6,
    changeFrequency: "weekly",
    lastModified: now,
  }));
  const matches: MetadataRoute.Sitemap = allMatchIds().map((id) => ({
    url: `${SITE.url}/match/${id}/`,
    priority: 0.4,
    changeFrequency: "monthly",
    lastModified: now,
  }));

  // WNBA section — always list the static routes; data-driven URLs only when
  // the WNBA datasets exist.
  const wnbaTop: MetadataRoute.Sitemap = [
    "/wnba/", "/wnba/play/", "/wnba/games/", "/wnba/model/", "/wnba/ladder/",
    "/wnba/playoffs/", "/wnba/teams/", "/wnba/players/", "/wnba/fixtures/", "/wnba/stats/",
  ].map((path) => ({ url: `${SITE.url}${path}`, priority: 0.6, changeFrequency: "weekly", lastModified: now }));
  const wnbaTeams: MetadataRoute.Sitemap = safe(() => allTeams("wnba")).map((t) => ({
    url: `${SITE.url}/wnba/teams/${t.abbr.toLowerCase()}/`, priority: 0.5, changeFrequency: "weekly", lastModified: now,
  }));
  const wnbaPlayers: MetadataRoute.Sitemap = safe(() => allPlayers("wnba")).map((p) => ({
    url: `${SITE.url}/wnba/players/${p.id}/${p.slug}/`, priority: 0.4, changeFrequency: "weekly", lastModified: now,
  }));
  const wnbaMatches: MetadataRoute.Sitemap = safe(() => allMatchIds("wnba")).map((id) => ({
    url: `${SITE.url}/wnba/match/${id}/`, priority: 0.3, changeFrequency: "monthly", lastModified: now,
  }));

  return [...top, ...teams, ...games, ...players, ...matches, ...wnbaTop, ...wnbaTeams, ...wnbaPlayers, ...wnbaMatches];
}
