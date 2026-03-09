import type { NextConfig } from "next";
import path from "node:path";

const appRoot = process.cwd();

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
    resolveAlias: {
      tailwindcss: path.join(appRoot, "node_modules/tailwindcss"),
    },
  },
};

export default nextConfig;
