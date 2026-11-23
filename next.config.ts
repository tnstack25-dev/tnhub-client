import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/access/roles", destination: "/roles", permanent: true },
      { source: "/access/permissions", destination: "/permissions", permanent: true },
      { source: "/access/members", destination: "/users", permanent: true },
    ];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
