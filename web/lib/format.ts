export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** The five basketball position codes, in line-up order. */
export const POS_CODES = ["PG", "SG", "SF", "PF", "C"] as const;
export type PosCode = (typeof POS_CODES)[number];

export const POS_LABEL: Record<string, string> = {
  PG: "Point Guard", SG: "Shooting Guard", SF: "Small Forward",
  PF: "Power Forward", C: "Center",
};

/** Broad position group for filtering. */
export const POS_GROUP: Record<string, string> = {
  PG: "Guard", SG: "Guard", SF: "Forward", PF: "Forward", C: "Center",
};

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() || "")
    .join(".");
}
