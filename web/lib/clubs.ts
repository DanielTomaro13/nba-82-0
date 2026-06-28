/** Team colours + abbreviations, per league, keyed by franchise nickname. */
import type { LeagueId } from "@/lib/league";

/** NBA team colours, keyed by the franchise nickname (a substring of the name). */
const NBA_CLUB_COLORS: [match: string, primary: string, secondary: string][] = [
  ["Hawks", "#e03a3e", "#c1d32f"],
  ["Celtics", "#007a33", "#ba9653"],
  ["Nets", "#000000", "#ffffff"],
  ["Hornets", "#1d1160", "#00788c"],
  ["Bulls", "#ce1141", "#000000"],
  ["Cavaliers", "#860038", "#fdbb30"],
  ["Mavericks", "#00538c", "#b8c4ca"],
  ["Nuggets", "#0e2240", "#fec524"],
  ["Pistons", "#c8102e", "#1d42ba"],
  ["Warriors", "#1d428a", "#ffc72c"],
  ["Rockets", "#ce1141", "#c4ced4"],
  ["Pacers", "#002d62", "#fdbb30"],
  ["Clippers", "#c8102e", "#1d428a"],
  ["Lakers", "#552583", "#fdb927"],
  ["Grizzlies", "#5d76a9", "#12173f"],
  ["Heat", "#98002e", "#f9a01b"],
  ["Bucks", "#00471b", "#eee1c6"],
  ["Timberwolves", "#0c2340", "#236192"],
  ["Pelicans", "#0c2340", "#c8102e"],
  ["Knicks", "#006bb6", "#f58426"],
  ["Thunder", "#007ac1", "#ef3b24"],
  ["Magic", "#0077c0", "#c4ced4"],
  ["76ers", "#006bb6", "#ed174c"],
  ["Suns", "#1d1160", "#e56020"],
  ["Trail Blazers", "#e03a3e", "#000000"],
  ["Blazers", "#e03a3e", "#000000"],
  ["Kings", "#5a2d81", "#63727a"],
  ["Spurs", "#c4ced4", "#000000"],
  ["Raptors", "#ce1141", "#000000"],
  ["Jazz", "#002b5c", "#00471b"],
  ["Wizards", "#002b5c", "#e31837"],
  ["SuperSonics", "#016332", "#fbe122"],
  ["Sonics", "#016332", "#fbe122"],
  ["Bullets", "#002b5c", "#e31837"],
];

/** WNBA team colours, keyed by franchise nickname. Includes defunct franchises. */
const WNBA_CLUB_COLORS: [match: string, primary: string, secondary: string][] = [
  ["Dream", "#e03a3e", "#000000"],
  ["Sky", "#418fde", "#fdd023"],
  ["Sun", "#dc4405", "#0a2240"],
  ["Wings", "#0c2340", "#c4d600"],
  ["Valkyries", "#5b2c83", "#000000"],
  ["Fever", "#002d62", "#e03a3e"],
  ["Aces", "#000000", "#ba0c2f"],
  ["Sparks", "#552583", "#fdb927"],
  ["Lynx", "#266092", "#79bc43"],
  ["Liberty", "#6eceb2", "#000000"],
  ["Mercury", "#e56020", "#1d1160"],
  ["Storm", "#2c5234", "#fedb00"],
  ["Mystics", "#e03a3e", "#002b5c"],
  // defunct
  ["Comets", "#ba0c2f", "#fdb927"],
  ["Rockers", "#862633", "#fdbb30"],
  ["Sting", "#008752", "#6f2c91"],
  ["Sol", "#f47920", "#000000"],
  ["Fire", "#d50032", "#000000"],
  ["Monarchs", "#6f2c91", "#fdb927"],
];

const COLORS: Record<LeagueId, [string, string, string][]> = {
  nba: NBA_CLUB_COLORS,
  wnba: WNBA_CLUB_COLORS,
};

export function clubColors(club: string, league: LeagueId = "nba"): [string, string] {
  const hit = COLORS[league].find(([m]) => club.includes(m));
  return hit ? [hit[1], hit[2]] : ["#26263a", "#9b9bad"];
}

const NBA_ABBR: Record<string, string> = {
  Hawks: "ATL", Celtics: "BOS", Nets: "BKN", Hornets: "CHA", Bulls: "CHI",
  Cavaliers: "CLE", Mavericks: "DAL", Nuggets: "DEN", Pistons: "DET",
  Warriors: "GSW", Rockets: "HOU", Pacers: "IND", Clippers: "LAC",
  Lakers: "LAL", Grizzlies: "MEM", Heat: "MIA", Bucks: "MIL",
  Timberwolves: "MIN", Pelicans: "NOP", Knicks: "NYK", Thunder: "OKC",
  Magic: "ORL", "76ers": "PHI", Suns: "PHX", "Trail Blazers": "POR",
  Kings: "SAC", Spurs: "SAS", Raptors: "TOR", Jazz: "UTA", Wizards: "WAS",
  SuperSonics: "SEA", Bullets: "WAS",
};

const WNBA_ABBR: Record<string, string> = {
  Dream: "ATL", Sky: "CHI", Sun: "CON", Wings: "DAL", Valkyries: "GSV",
  Fever: "IND", Aces: "LVA", Sparks: "LAS", Lynx: "MIN", Liberty: "NYL",
  Mercury: "PHO", Storm: "SEA", Mystics: "WAS",
  Comets: "HOU", Rockers: "CLE", Sting: "CHA", Sol: "MIA", Fire: "POR", Monarchs: "SAC",
};

const ABBR: Record<LeagueId, Record<string, string>> = { nba: NBA_ABBR, wnba: WNBA_ABBR };

/** A short 3-letter abbreviation for a team. */
export function clubAbbr(club: string, league: LeagueId = "nba"): string {
  for (const [k, v] of Object.entries(ABBR[league])) if (club.includes(k)) return v;
  return club.slice(0, 3).toUpperCase();
}
