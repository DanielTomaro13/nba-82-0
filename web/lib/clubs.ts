/** NBA team colours, keyed by the franchise nickname (a substring of the name). */
const CLUB_COLORS: [match: string, primary: string, secondary: string][] = [
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

export function clubColors(club: string): [string, string] {
  const hit = CLUB_COLORS.find(([m]) => club.includes(m));
  return hit ? [hit[1], hit[2]] : ["#26263a", "#9b9bad"];
}

/** A short 3-letter abbreviation for a team. */
export function clubAbbr(club: string): string {
  const map: Record<string, string> = {
    Hawks: "ATL", Celtics: "BOS", Nets: "BKN", Hornets: "CHA", Bulls: "CHI",
    Cavaliers: "CLE", Mavericks: "DAL", Nuggets: "DEN", Pistons: "DET",
    Warriors: "GSW", Rockets: "HOU", Pacers: "IND", Clippers: "LAC",
    Lakers: "LAL", Grizzlies: "MEM", Heat: "MIA", Bucks: "MIL",
    Timberwolves: "MIN", Pelicans: "NOP", Knicks: "NYK", Thunder: "OKC",
    Magic: "ORL", "76ers": "PHI", Suns: "PHX", "Trail Blazers": "POR",
    Kings: "SAC", Spurs: "SAS", Raptors: "TOR", Jazz: "UTA", Wizards: "WAS",
    SuperSonics: "SEA", Bullets: "WAS",
  };
  for (const [k, v] of Object.entries(map)) if (club.includes(k)) return v;
  return club.slice(0, 3).toUpperCase();
}
