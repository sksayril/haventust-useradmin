import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "streaming-bucket-123.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "streaming-bucket-123.s3.us-east-1.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
