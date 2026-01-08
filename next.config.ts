import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'puldocfkpdnvqvthhwwa.supabase.co',
      },
    ],
  },
};

export default nextConfig;
