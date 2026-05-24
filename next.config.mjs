/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mode standalone diperlukan untuk container deployment (podman/docker)
  // Vercel juga support mode ini
  output: "standalone",
  images: {

    remotePatterns: [],
  },
  reactStrictMode: true,

  // Proxy /api/* → backend container in production
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL ?? "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${backendUrl}/health`,
      },
    ];
  },
};

export default nextConfig;

