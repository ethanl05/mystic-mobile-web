/** @type {import("next").NextConfig} */
const nextConfig = {
  typedRoutes: false,
  allowedDevOrigins: ["127.0.0.1"],
  outputFileTracingRoot: __dirname,
  experimental: {
    devtoolSegmentExplorer: false
  }
};

module.exports = nextConfig;
