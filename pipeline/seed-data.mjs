/**
 * NBA 82-0 — seed dataset generator.
 * ---------------------------------------------------------------------------
 * The live pipeline (build-data.mjs) pulls real box scores from the NBA Stats
 * API, but that API black-holes datacenter IPs, so this generator ships a
 * real-player, plausible-standings dataset the static site can build against
 * immediately. The weekly refresh workflow overwrites it with live data.
 *
 * Players are real, with approximate real career per-game lines and an all-time
 * rating. Standings/fixtures are modelled from a per-team strength prior with a
 * seeded season simulation so the ladder, fixtures and Score Predictor work.
 *
 * Outputs → web/public/data/: meta.json, pool.json, games.json,
 * results.json, strengths.json (same schema as the live pipeline).
 */
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "web", "public", "data");

const POS_CODE_LABEL = {
  PG: "Point Guard", SG: "Shooting Guard", SF: "Small Forward",
  PF: "Power Forward", C: "Center",
};

/* ---- the 30 franchises + a base strength prior (rough recent form) -------- */
const TEAMS = [
  ["Boston Celtics", 0.70], ["Oklahoma City Thunder", 0.70], ["Denver Nuggets", 0.64],
  ["Cleveland Cavaliers", 0.63], ["New York Knicks", 0.61], ["Minnesota Timberwolves", 0.61],
  ["Milwaukee Bucks", 0.58], ["Los Angeles Lakers", 0.58], ["LA Clippers", 0.56],
  ["Dallas Mavericks", 0.55], ["Indiana Pacers", 0.55], ["Houston Rockets", 0.55],
  ["Golden State Warriors", 0.55], ["Phoenix Suns", 0.52], ["Orlando Magic", 0.52],
  ["Philadelphia 76ers", 0.52], ["Miami Heat", 0.51], ["Sacramento Kings", 0.49],
  ["Memphis Grizzlies", 0.52], ["Atlanta Hawks", 0.48], ["Detroit Pistons", 0.47],
  ["Chicago Bulls", 0.44], ["San Antonio Spurs", 0.45], ["Toronto Raptors", 0.42],
  ["Brooklyn Nets", 0.38], ["New Orleans Pelicans", 0.45], ["Portland Trail Blazers", 0.40],
  ["Charlotte Hornets", 0.36], ["Utah Jazz", 0.34], ["Washington Wizards", 0.30],
];

const SEASONS = ["2024-25", "2023-24", "2022-23", "2021-22", "2020-21"];

/* ---- curated real players: [name, team, pos, rating, pts, reb, ast, stl, blk, fy, ly, gp, era] */
const P = [
  // ---- 1980s / pre-merger legends ----
  ["Magic Johnson", "Los Angeles Lakers", "PG", 97, 19.5, 7.2, 11.2, 1.9, 0.4, 1979, 1996, 906, "1980s"],
  ["Kareem Abdul-Jabbar", "Los Angeles Lakers", "C", 96, 24.6, 11.2, 3.6, 0.9, 2.6, 1969, 1989, 1560, "1980s"],
  ["Larry Bird", "Boston Celtics", "SF", 96, 24.3, 10.0, 6.3, 1.7, 0.8, 1979, 1992, 897, "1980s"],
  ["Julius Erving", "Philadelphia 76ers", "SF", 92, 22.0, 6.7, 3.9, 1.8, 1.5, 1976, 1987, 836, "1980s"],
  ["Moses Malone", "Philadelphia 76ers", "C", 91, 20.6, 12.2, 1.4, 0.8, 1.3, 1976, 1995, 1329, "1980s"],
  ["Isiah Thomas", "Detroit Pistons", "PG", 90, 19.2, 3.6, 9.3, 1.9, 0.3, 1981, 1994, 979, "1980s"],
  ["James Worthy", "Los Angeles Lakers", "SF", 86, 17.6, 5.1, 3.0, 1.1, 0.7, 1982, 1994, 926, "1980s"],
  ["Kevin McHale", "Boston Celtics", "PF", 87, 17.9, 7.3, 1.7, 0.4, 1.7, 1980, 1993, 971, "1980s"],
  ["Robert Parish", "Boston Celtics", "C", 84, 14.5, 9.1, 1.4, 0.8, 1.5, 1976, 1997, 1611, "1980s"],
  ["Dominique Wilkins", "Atlanta Hawks", "SF", 88, 24.8, 6.7, 2.5, 1.3, 0.6, 1982, 1999, 1074, "1980s"],
  ["Clyde Drexler", "Portland Trail Blazers", "SG", 89, 20.4, 6.1, 5.6, 2.0, 0.7, 1983, 1998, 1086, "1990s"],

  // ---- 1990s ----
  ["Michael Jordan", "Chicago Bulls", "SG", 99, 30.1, 6.2, 5.3, 2.3, 0.8, 1984, 2003, 1072, "1990s"],
  ["Scottie Pippen", "Chicago Bulls", "SF", 92, 16.1, 6.4, 5.2, 2.0, 0.8, 1987, 2004, 1178, "1990s"],
  ["Dennis Rodman", "Chicago Bulls", "PF", 85, 7.3, 13.1, 1.8, 0.7, 0.6, 1986, 2000, 911, "1990s"],
  ["Hakeem Olajuwon", "Houston Rockets", "C", 95, 21.8, 11.1, 2.5, 1.7, 3.1, 1984, 2002, 1238, "1990s"],
  ["David Robinson", "San Antonio Spurs", "C", 93, 21.1, 10.6, 2.5, 1.4, 3.0, 1989, 2003, 987, "1990s"],
  ["Karl Malone", "Utah Jazz", "PF", 94, 25.0, 10.1, 3.6, 1.4, 0.8, 1985, 2004, 1476, "1990s"],
  ["John Stockton", "Utah Jazz", "PG", 92, 13.1, 2.7, 10.5, 2.2, 0.2, 1984, 2003, 1504, "1990s"],
  ["Charles Barkley", "Phoenix Suns", "PF", 93, 22.1, 11.7, 3.9, 1.5, 0.8, 1984, 2000, 1073, "1990s"],
  ["Patrick Ewing", "New York Knicks", "C", 91, 21.0, 9.8, 1.9, 1.0, 2.4, 1985, 2002, 1183, "1990s"],
  ["Reggie Miller", "Indiana Pacers", "SG", 88, 18.2, 3.0, 3.0, 1.1, 0.2, 1987, 2005, 1389, "1990s"],
  ["Gary Payton", "Seattle SuperSonics", "PG", 90, 16.3, 3.9, 6.7, 1.8, 0.2, 1990, 2007, 1335, "1990s"],
  ["Shawn Kemp", "Seattle SuperSonics", "PF", 86, 14.6, 8.4, 1.6, 1.1, 1.2, 1989, 2003, 1051, "1990s"],
  ["Alonzo Mourning", "Miami Heat", "C", 87, 17.1, 8.5, 1.1, 0.5, 2.8, 1992, 2008, 838, "1990s"],
  ["Grant Hill", "Detroit Pistons", "SF", 86, 16.7, 6.0, 4.1, 1.2, 0.6, 1994, 2013, 1026, "1990s"],
  ["Mitch Richmond", "Sacramento Kings", "SG", 84, 21.0, 3.9, 3.5, 1.2, 0.3, 1988, 2002, 976, "1990s"],

  // ---- 2000s ----
  ["Kobe Bryant", "Los Angeles Lakers", "SG", 97, 25.0, 5.2, 4.7, 1.4, 0.5, 1996, 2016, 1346, "2000s"],
  ["Shaquille O'Neal", "Los Angeles Lakers", "C", 96, 23.7, 10.9, 2.5, 0.6, 2.3, 1992, 2011, 1207, "2000s"],
  ["Tim Duncan", "San Antonio Spurs", "PF", 95, 19.0, 10.8, 3.0, 0.7, 2.2, 1997, 2016, 1392, "2000s"],
  ["Kevin Garnett", "Minnesota Timberwolves", "PF", 93, 17.8, 10.0, 3.7, 1.3, 1.4, 1995, 2016, 1462, "2000s"],
  ["Dirk Nowitzki", "Dallas Mavericks", "PF", 93, 20.7, 7.5, 2.4, 0.8, 0.8, 1998, 2019, 1522, "2000s"],
  ["Allen Iverson", "Philadelphia 76ers", "PG", 92, 26.7, 3.7, 6.2, 2.2, 0.2, 1996, 2010, 914, "2000s"],
  ["Steve Nash", "Phoenix Suns", "PG", 90, 14.3, 3.0, 8.5, 0.7, 0.1, 1996, 2015, 1217, "2000s"],
  ["Jason Kidd", "New Jersey Nets", "PG", 89, 12.6, 6.3, 8.7, 1.9, 0.3, 1994, 2013, 1391, "2000s"],
  ["Tracy McGrady", "Houston Rockets", "SG", 89, 19.6, 5.6, 4.4, 1.2, 0.9, 1997, 2013, 938, "2000s"],
  ["Vince Carter", "Toronto Raptors", "SG", 88, 16.7, 4.3, 3.1, 1.0, 0.6, 1998, 2020, 1541, "2000s"],
  ["Paul Pierce", "Boston Celtics", "SF", 89, 19.7, 5.6, 3.5, 1.3, 0.5, 1998, 2017, 1343, "2000s"],
  ["Ray Allen", "Boston Celtics", "SG", 88, 18.9, 4.1, 3.4, 1.1, 0.2, 1996, 2014, 1300, "2000s"],
  ["Dwyane Wade", "Miami Heat", "SG", 93, 22.0, 4.7, 5.4, 1.5, 0.8, 2003, 2019, 1054, "2000s"],
  ["Carmelo Anthony", "Denver Nuggets", "SF", 89, 22.5, 6.2, 2.7, 1.0, 0.5, 2003, 2022, 1260, "2000s"],
  ["Pau Gasol", "Los Angeles Lakers", "C", 85, 17.0, 9.2, 3.2, 0.5, 1.6, 2001, 2019, 1226, "2000s"],
  ["Yao Ming", "Houston Rockets", "C", 84, 19.0, 9.2, 1.6, 0.4, 1.9, 2002, 2011, 486, "2000s"],
  ["Manu Ginobili", "San Antonio Spurs", "SG", 86, 13.3, 3.5, 3.8, 1.3, 0.3, 2002, 2018, 1057, "2000s"],
  ["Tony Parker", "San Antonio Spurs", "PG", 86, 15.5, 2.7, 5.6, 0.8, 0.1, 2001, 2019, 1254, "2000s"],
  ["Chauncey Billups", "Detroit Pistons", "PG", 84, 15.2, 2.9, 5.4, 1.0, 0.2, 1997, 2014, 1043, "2000s"],
  ["Ben Wallace", "Detroit Pistons", "C", 82, 5.7, 9.6, 1.3, 1.3, 2.0, 1996, 2012, 1088, "2000s"],

  // ---- 2010s ----
  ["LeBron James", "Cleveland Cavaliers", "SF", 98, 27.1, 7.5, 7.4, 1.5, 0.7, 2003, 2025, 1490, "2010s"],
  ["Kevin Durant", "Oklahoma City Thunder", "SF", 96, 27.3, 7.0, 4.4, 1.1, 1.1, 2007, 2025, 1090, "2010s"],
  ["Stephen Curry", "Golden State Warriors", "PG", 97, 24.8, 4.7, 6.4, 1.6, 0.2, 2009, 2025, 1010, "2010s"],
  ["Russell Westbrook", "Oklahoma City Thunder", "PG", 90, 21.7, 7.0, 8.3, 1.7, 0.3, 2008, 2025, 1150, "2010s"],
  ["James Harden", "Houston Rockets", "SG", 92, 24.1, 5.6, 7.0, 1.5, 0.5, 2009, 2025, 1060, "2010s"],
  ["Klay Thompson", "Golden State Warriors", "SG", 86, 19.6, 3.5, 2.3, 0.8, 0.5, 2011, 2025, 800, "2010s"],
  ["Draymond Green", "Golden State Warriors", "PF", 83, 8.7, 7.0, 5.6, 1.4, 0.8, 2012, 2025, 820, "2010s"],
  ["Kawhi Leonard", "San Antonio Spurs", "SF", 92, 19.9, 6.4, 3.5, 1.8, 0.6, 2011, 2025, 650, "2010s"],
  ["Paul George", "Indiana Pacers", "SF", 88, 20.8, 6.2, 3.7, 1.7, 0.4, 2010, 2025, 850, "2010s"],
  ["Chris Paul", "LA Clippers", "PG", 90, 17.1, 4.5, 9.4, 2.1, 0.1, 2005, 2025, 1300, "2010s"],
  ["Anthony Davis", "New Orleans Pelicans", "PF", 92, 24.0, 10.4, 2.5, 1.3, 2.3, 2012, 2025, 750, "2010s"],
  ["Damian Lillard", "Portland Trail Blazers", "PG", 90, 25.1, 4.2, 6.7, 1.0, 0.3, 2012, 2025, 850, "2010s"],
  ["Kyrie Irving", "Cleveland Cavaliers", "PG", 89, 23.6, 3.9, 5.7, 1.3, 0.4, 2011, 2025, 750, "2010s"],
  ["Blake Griffin", "LA Clippers", "PF", 84, 19.8, 8.0, 4.2, 0.9, 0.4, 2010, 2023, 700, "2010s"],
  ["DeMar DeRozan", "Toronto Raptors", "SG", 85, 20.8, 4.2, 3.6, 1.0, 0.3, 2009, 2025, 1050, "2010s"],
  ["Dwight Howard", "Orlando Magic", "C", 87, 15.7, 11.8, 1.3, 0.9, 1.8, 2004, 2022, 1242, "2010s"],
  ["Chris Bosh", "Miami Heat", "PF", 84, 19.2, 8.5, 2.0, 0.8, 1.0, 2003, 2016, 893, "2010s"],
  ["Marc Gasol", "Memphis Grizzlies", "C", 82, 14.0, 7.4, 3.4, 0.9, 1.4, 2008, 2020, 879, "2010s"],
  ["Kyle Lowry", "Toronto Raptors", "PG", 83, 14.7, 4.4, 6.3, 1.4, 0.3, 2006, 2024, 1000, "2010s"],
  ["John Wall", "Washington Wizards", "PG", 84, 19.0, 4.2, 9.0, 1.6, 0.7, 2010, 2023, 613, "2010s"],
  ["Kemba Walker", "Charlotte Hornets", "PG", 83, 19.8, 3.9, 5.6, 1.2, 0.4, 2011, 2022, 605, "2010s"],
  ["Andre Drummond", "Detroit Pistons", "C", 81, 13.8, 13.2, 1.4, 1.3, 1.4, 2012, 2025, 800, "2010s"],

  // ---- 2020s / current ----
  ["Giannis Antetokounmpo", "Milwaukee Bucks", "PF", 96, 23.0, 9.8, 4.8, 1.1, 1.2, 2013, 2025, 800, "2020s"],
  ["Nikola Jokic", "Denver Nuggets", "C", 97, 21.0, 10.9, 7.0, 1.3, 0.7, 2015, 2025, 700, "2020s"],
  ["Joel Embiid", "Philadelphia 76ers", "C", 94, 27.9, 11.2, 3.7, 1.0, 1.7, 2016, 2025, 450, "2020s"],
  ["Luka Doncic", "Dallas Mavericks", "PG", 95, 28.6, 8.7, 8.3, 1.2, 0.5, 2018, 2025, 400, "2020s"],
  ["Jayson Tatum", "Boston Celtics", "SF", 93, 23.5, 7.3, 4.0, 1.0, 0.7, 2017, 2025, 550, "2020s"],
  ["Shai Gilgeous-Alexander", "Oklahoma City Thunder", "PG", 94, 24.0, 4.8, 5.5, 1.6, 0.8, 2018, 2025, 400, "2020s"],
  ["Anthony Edwards", "Minnesota Timberwolves", "SG", 90, 24.0, 5.5, 4.3, 1.4, 0.6, 2020, 2025, 350, "2020s"],
  ["Devin Booker", "Phoenix Suns", "SG", 90, 24.3, 4.2, 5.0, 0.9, 0.3, 2015, 2025, 600, "2020s"],
  ["Jimmy Butler", "Miami Heat", "SF", 89, 18.0, 5.3, 4.3, 1.6, 0.4, 2011, 2025, 850, "2020s"],
  ["Donovan Mitchell", "Cleveland Cavaliers", "SG", 89, 24.0, 4.3, 4.6, 1.4, 0.3, 2017, 2025, 500, "2020s"],
  ["Trae Young", "Atlanta Hawks", "PG", 87, 25.5, 3.0, 9.5, 1.1, 0.1, 2018, 2025, 450, "2020s"],
  ["Ja Morant", "Memphis Grizzlies", "PG", 87, 22.5, 5.5, 7.5, 1.0, 0.3, 2019, 2025, 300, "2020s"],
  ["Zion Williamson", "New Orleans Pelicans", "PF", 86, 24.5, 6.8, 4.0, 1.0, 0.6, 2019, 2025, 250, "2020s"],
  ["De'Aaron Fox", "Sacramento Kings", "PG", 86, 21.5, 4.0, 6.0, 1.6, 0.4, 2017, 2025, 500, "2020s"],
  ["Domantas Sabonis", "Sacramento Kings", "C", 85, 16.0, 11.0, 5.0, 0.8, 0.4, 2016, 2025, 600, "2020s"],
  ["Bam Adebayo", "Miami Heat", "C", 85, 16.0, 9.5, 4.0, 1.1, 0.8, 2017, 2025, 550, "2020s"],
  ["Jaylen Brown", "Boston Celtics", "SG", 87, 19.5, 5.0, 3.0, 1.1, 0.4, 2016, 2025, 550, "2020s"],
  ["Tyrese Haliburton", "Indiana Pacers", "PG", 86, 18.0, 4.0, 9.5, 1.5, 0.5, 2020, 2025, 350, "2020s"],
  ["Victor Wembanyama", "San Antonio Spurs", "C", 90, 21.0, 11.0, 3.5, 1.2, 3.5, 2023, 2025, 120, "2020s"],
  ["Paolo Banchero", "Orlando Magic", "PF", 84, 21.0, 6.8, 4.5, 0.9, 0.6, 2022, 2025, 200, "2020s"],
  ["Cade Cunningham", "Detroit Pistons", "PG", 84, 20.0, 5.5, 7.0, 1.0, 0.6, 2021, 2025, 200, "2020s"],
  ["Jalen Brunson", "New York Knicks", "PG", 88, 22.0, 3.5, 6.5, 0.8, 0.2, 2018, 2025, 450, "2020s"],
  ["Karl-Anthony Towns", "Minnesota Timberwolves", "C", 87, 23.0, 11.0, 3.2, 0.8, 1.2, 2015, 2025, 600, "2020s"],
  ["Pascal Siakam", "Toronto Raptors", "PF", 85, 18.5, 6.5, 3.5, 0.9, 0.6, 2016, 2025, 600, "2020s"],
  ["LaMelo Ball", "Charlotte Hornets", "PG", 84, 20.0, 5.5, 7.5, 1.5, 0.3, 2020, 2025, 250, "2020s"],
  ["Scottie Barnes", "Toronto Raptors", "SF", 82, 16.0, 7.0, 5.5, 1.3, 0.8, 2021, 2025, 250, "2020s"],
  ["Franz Wagner", "Orlando Magic", "SF", 83, 19.0, 5.5, 4.5, 1.1, 0.3, 2021, 2025, 250, "2020s"],
  ["Alperen Sengun", "Houston Rockets", "C", 84, 18.0, 9.0, 5.0, 1.1, 0.7, 2021, 2025, 250, "2020s"],
  ["Tyrese Maxey", "Philadelphia 76ers", "SG", 86, 22.0, 3.5, 6.0, 0.9, 0.3, 2020, 2025, 300, "2020s"],
  ["Jaren Jackson Jr.", "Memphis Grizzlies", "PF", 84, 18.0, 5.5, 1.5, 1.0, 2.5, 2018, 2025, 400, "2020s"],
  ["Evan Mobley", "Cleveland Cavaliers", "PF", 84, 15.5, 9.0, 3.0, 0.9, 1.5, 2021, 2025, 300, "2020s"],
  ["Mikal Bridges", "Brooklyn Nets", "SF", 83, 17.0, 4.0, 3.0, 1.1, 0.5, 2018, 2025, 500, "2020s"],
  ["Desmond Bane", "Memphis Grizzlies", "SG", 83, 20.0, 4.5, 4.5, 1.1, 0.3, 2020, 2025, 300, "2020s"],
  ["Lauri Markkanen", "Utah Jazz", "PF", 83, 20.0, 8.0, 2.0, 0.7, 0.5, 2017, 2025, 450, "2020s"],
  ["Jrue Holiday", "Boston Celtics", "PG", 84, 17.0, 4.5, 6.5, 1.6, 0.4, 2009, 2025, 950, "2020s"],
  ["Rudy Gobert", "Minnesota Timberwolves", "C", 85, 12.5, 11.5, 1.3, 0.7, 2.1, 2013, 2025, 750, "2020s"],
  ["Jamal Murray", "Denver Nuggets", "PG", 84, 18.0, 4.0, 5.5, 1.1, 0.3, 2016, 2025, 500, "2020s"],
  ["Kristaps Porzingis", "Boston Celtics", "C", 83, 19.0, 8.0, 1.8, 0.7, 1.8, 2015, 2025, 500, "2020s"],
  ["Brandon Ingram", "New Orleans Pelicans", "SF", 84, 20.0, 5.0, 5.0, 0.7, 0.6, 2016, 2025, 500, "2020s"],
  ["Zach LaVine", "Chicago Bulls", "SG", 84, 20.0, 4.5, 4.0, 0.9, 0.3, 2014, 2025, 600, "2020s"],
  ["Bradley Beal", "Washington Wizards", "SG", 85, 22.0, 4.0, 4.5, 1.1, 0.4, 2012, 2025, 750, "2020s"],
  ["Anfernee Simons", "Portland Trail Blazers", "SG", 82, 18.0, 3.0, 4.5, 0.7, 0.2, 2018, 2025, 350, "2020s"],
  ["Jalen Williams", "Oklahoma City Thunder", "SF", 84, 19.0, 5.5, 4.5, 1.6, 0.6, 2022, 2025, 200, "2020s"],
  ["Jalen Duren", "Detroit Pistons", "C", 80, 12.0, 11.0, 2.5, 0.7, 1.0, 2022, 2025, 200, "2020s"],
  ["OG Anunoby", "New York Knicks", "SF", 82, 14.0, 4.5, 2.0, 1.5, 0.6, 2017, 2025, 450, "2020s"],

  // ---- second-stint cards (give marquee franchises depth across eras) ----
  ["LeBron James", "Los Angeles Lakers", "SF", 96, 25.5, 7.8, 8.0, 1.2, 0.5, 2003, 2025, 1490, "2020s"],
  ["Kevin Durant", "Golden State Warriors", "SF", 95, 25.8, 6.8, 5.5, 0.8, 1.1, 2007, 2025, 1090, "2010s"],
  ["Anthony Davis", "Los Angeles Lakers", "PF", 91, 24.7, 11.0, 3.1, 1.2, 2.2, 2012, 2025, 750, "2020s"],
  ["Russell Westbrook", "Washington Wizards", "PG", 85, 22.2, 11.5, 11.7, 1.4, 0.3, 2008, 2025, 1150, "2020s"],
  ["Chris Paul", "Phoenix Suns", "PG", 87, 15.0, 4.5, 9.0, 1.5, 0.2, 2005, 2025, 1300, "2020s"],
  ["Kyrie Irving", "Dallas Mavericks", "PG", 88, 24.0, 4.8, 5.0, 1.3, 0.5, 2011, 2025, 750, "2020s"],
  ["Jimmy Butler", "Chicago Bulls", "SF", 85, 15.0, 4.8, 3.0, 1.6, 0.5, 2011, 2025, 850, "2010s"],
  ["Kawhi Leonard", "LA Clippers", "SF", 91, 23.5, 6.5, 4.5, 1.6, 0.6, 2011, 2025, 650, "2020s"],
];

/* ---- rating-ish recompute kept light: trust curated ratings -------------- */
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/* seeded PRNG */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

async function main() {
  const t0 = Date.now();

  /* ---- pool (one card per curated entry) -------------------------------- */
  const pool = [];
  let pid = 1000;
  for (const row of P) {
    const [name, club, pos, rating, pts, reb, ast, stl, blk, fy, ly, gp, era] = row;
    if (!rating || pos === "x") continue;
    pid += 1;
    pool.push({
      id: `nba-${pid}`, pid, name, club, era, pos,
      posName: POS_CODE_LABEL[pos] || "Forward",
      elig: [pos], rating, g: Math.min(82, Math.round(gp / Math.max(1, ly - fy + 1))),
      pts, reb, ast, stl, blk, fg3: +(pts > 18 ? (pos === "C" ? 0.6 : 1.8) : 0.8).toFixed(1),
    });
  }
  pool.sort((a, b) => b.rating - a.rating);
  console.log(`✓ pool: ${pool.length} player cards`);

  /* ---- careers / mini-game players (dedupe by name) --------------------- */
  const byName = new Map();
  for (const row of P) {
    const [name, club, pos, rating, pts, reb, ast, stl, blk, fy, ly, gp] = row;
    if (!rating || pos === "x") continue;
    const cur = byName.get(name);
    if (!cur || rating > cur.rating) {
      byName.set(name, {
        id: hash(name) % 2000000, name, club, pos,
        posName: POS_CODE_LABEL[pos] || "Forward",
        firstYear: fy, lastYear: ly, apps: gp,
        pts, reb, ast, stl, blk, rating,
      });
    } else {
      cur.firstYear = Math.min(cur.firstYear, fy);
      cur.lastYear = Math.max(cur.lastYear, ly);
    }
  }
  const gamePlayers = [...byName.values()].map((c) => ({
    ...c,
    fame: Math.round(c.rating + Math.min(18, c.apps / 90) + c.pts / 3),
  }));
  gamePlayers.sort((a, b) => b.fame - a.fame);
  console.log(`✓ games: ${gamePlayers.length} career players`);

  /* ---- model standings + fixtures per season ---------------------------- */
  const resultsBySeason = {};
  const laddersBySeason = {};
  const strengthsBySeason = {};

  for (const season of SEASONS) {
    const rand = mulberry32(hash(season));
    // season-specific strength: base prior + noise
    const strength = new Map();
    for (const [team, base] of TEAMS) {
      strength.set(team, clamp(base + (rand() - 0.5) * 0.16, 0.20, 0.80));
    }
    const teams = TEAMS.map(([t]) => t);
    const table = {};
    for (const t of teams) table[t] = { club: t, p: 0, w: 0, l: 0, d: 0, pf: 0, pa: 0 };
    const games = [];

    // a balanced ~ double round-robin (each pair twice) ≈ 58 games each; tag a
    // pseudo "round" by chunking so fixtures group nicely.
    let gi = 0;
    for (let leg = 0; leg < 2; leg++) {
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const home = leg === 0 ? teams[i] : teams[j];
          const away = leg === 0 ? teams[j] : teams[i];
          const sh = strength.get(home) + 0.04; // home edge
          const sa = strength.get(away);
          const p = (sh * (1 - sa)) / (sh * (1 - sa) + sa * (1 - sh) || 1e-9);
          const homeWins = rand() < clamp(p, 0.08, 0.92);
          const margin = 1 + Math.floor(rand() * 22);
          const baseScore = 104 + Math.floor(rand() * 18);
          const hs = homeWins ? baseScore + margin : baseScore - margin + (rand() < 0.5 ? 0 : 1);
          const as = homeWins ? baseScore - 0 : baseScore + margin;
          const HS = homeWins ? Math.max(hs, as + 1) : Math.min(hs, as - 1);
          const AS = as;
          const fh = HS, fa = AS;
          const H = table[home], A = table[away];
          H.p++; A.p++; H.pf += fh; H.pa += fa; A.pf += fa; A.pa += fh;
          if (fh > fa) { H.w++; A.l++; } else { A.w++; H.l++; }
          games.push({ round: Math.floor(gi / 15) + 1, home, away, hs: fh, as: fa });
          gi++;
        }
      }
    }
    resultsBySeason[season] = games;

    const rows = Object.values(table).map((t) => ({ ...t, pts: t.w, pd: t.pf - t.pa }));
    rows.sort((a, b) => b.w - a.w || b.pd - a.pd);
    laddersBySeason[season] = rows;

    const winPct = rows.map((t) => (t.p ? t.w / t.p : 0)).sort((a, b) => a - b);
    strengthsBySeason[season] = winPct.map((x) => +x.toFixed(3));
  }
  console.log(`✓ standings + fixtures for ${SEASONS.length} seasons`);

  /* ---- write outputs ----------------------------------------------------- */
  await mkdir(OUT_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();
  const clubsBySeason = {};
  for (const s of SEASONS) clubsBySeason[s] = TEAMS.map(([t]) => t);
  const allClubs = [...new Set(pool.map((p) => p.club))].sort();
  const latestSeason = SEASONS[0];

  const meta = { generatedAt, seasons: SEASONS, latestSeason, clubs: allClubs, clubsBySeason };
  const games = { season: latestSeason, players: gamePlayers, strengthsBySeason };
  const results = { seasons: SEASONS, bySeason: resultsBySeason, laddersBySeason };
  const strengths = { bySeason: strengthsBySeason };

  await Promise.all([
    writeFile(join(OUT_DIR, "meta.json"), JSON.stringify(meta)),
    writeFile(join(OUT_DIR, "pool.json"), JSON.stringify(pool)),
    writeFile(join(OUT_DIR, "games.json"), JSON.stringify(games)),
    writeFile(join(OUT_DIR, "results.json"), JSON.stringify(results)),
    writeFile(join(OUT_DIR, "strengths.json"), JSON.stringify(strengths)),
  ]);
  console.log(`✓ wrote ${OUT_DIR} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch((e) => { console.error("✗ seed failed:", e); process.exit(1); });
