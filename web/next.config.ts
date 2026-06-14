import type { NextConfig } from "next";

// Static export for Cloudflare Pages. NEXT_PUBLIC_BASE_PATH stays empty on the
// root domain (nba82-0.com) and can be set to "/NBA-82-0" for project-path hosts.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
