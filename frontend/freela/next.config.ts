import type { NextConfig } from "next";
import path from "node:path";

function apiHostname(): string | undefined {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

const apiHost = apiHostname();

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/**",
      },
      ...(apiHost
        ? [
            {
              protocol: "https" as const,
              hostname: apiHost,
              pathname: "/**" as const,
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.gravatar.com",
        port: "",
        pathname: "/avatar/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' blob: data: https:; " +
              "connect-src 'self' https://api.stripe.com; " +
              "frame-src https://js.stripe.com https://hooks.stripe.com; " +
              "font-src 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
