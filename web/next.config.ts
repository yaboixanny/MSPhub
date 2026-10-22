import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page is built from the JSON data at build time and search runs in the
  // browser, so the site exports to plain HTML in out/ and any static host can serve it.
  output: "export",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
