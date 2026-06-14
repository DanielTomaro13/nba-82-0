/**
 * Google AdSense configuration.
 *
 * The loader script (in the root layout) enables **Auto Ads** as soon as Auto
 * Ads is switched on in the AdSense dashboard — no slot IDs required.
 *
 * The manual placements below are non-intrusive, results-area units (never
 * inside live gameplay). While a slot id is empty the placement renders
 * nothing, so the layout is never pushed around by an empty box.
 */
export const AD_CLIENT = "ca-pub-2087141992057731";

export const AD_SLOTS = {
  /** Home — responsive unit on the landing page */
  home: "5789788385",
  /** Result — shown on result/score screens and below each mini-game */
  result: "6838809461",
  /** alias used by GameShell (below a finished game) */
  game: "6838809461",
  /** optional sitewide bottom banner; left empty so Auto Ads handles the rest */
  inline: "",
};
