import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/gallery",
        destination: "/",
        permanent: false,
      },
      {
        source: "/organizer",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/organizer/:path*",
        destination: "/admin",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
