import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  allowedDevOrigins: ['192.168.100.9', 'localhost'],
};

export default nextConfig;
