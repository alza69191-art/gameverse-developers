import type { NextConfig } from "next";

const api = (process.env.GAMEVERSE_API_URL || "https://gameverse-platform-drdc.onrender.com").replace(/\/$/, "");
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${api}/api/v1/:path*` }];
  },
};

export default nextConfig;
