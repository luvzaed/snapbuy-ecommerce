import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product images can come from any URL an admin enters, so allow any host
    // (prevents next/image from throwing "hostname not configured" and crashing).
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
