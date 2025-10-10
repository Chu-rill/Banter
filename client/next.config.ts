import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // remove output: "standalone"
  pageExtensions: ["js", "jsx", "ts", "tsx"],
};

export default nextConfig;
