import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
    ] }];
  },
  images: {
    dangerouslyAllowLocalIP: false,
    maximumRedirects: 0,
    remotePatterns: (process.env.ALLOWED_IMAGE_HOSTS || 'images.unsplash.com,images.pexels.com,cdn.dsmcdn.com')
      .split(',').map(hostname => ({ protocol: 'https' as const, hostname: hostname.trim() })),
  },
};

export default nextConfig;
