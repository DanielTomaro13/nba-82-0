/** Build-time (server) readers for the static datasets. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Meta } from "@/lib/types";
import type { Results, Playoffs } from "@/lib/data";

function read<T>(file: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), "public", "data", file), "utf8")) as T;
}

export const serverMeta = () => read<Meta>("meta.json");
export const serverResults = () => read<Results>("results.json");
export const serverPlayoffs = () => read<Playoffs>("playoffs.json");
