/** @type {import('next').NextConfig} */
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to resolve module paths
const resolvePath = (modulePath) => {
  try {
    const pkgPath = path.resolve(__dirname, "node_modules", modulePath);
    return pkgPath;
  } catch (e) {
    console.error(`Failed to resolve ${modulePath}:`, e);
    return modulePath;
  }
};

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Configure compilation for React 19
  compiler: {
    // Enable new React JSX transform
    emotion: false,
    styledComponents: true,
    reactRemoveProperties: process.env.NODE_ENV === "production",
  },
  // Ensure React is properly loaded
  webpack: (config, { isServer }) => {
    // This allows Next.js to find React even with newer versions
    config.resolve.alias = {
      ...config.resolve.alias,
      "react/jsx-runtime": resolvePath("react/jsx-runtime"),
      "react/jsx-dev-runtime": resolvePath("react/jsx-dev-runtime"),
    };
    return config;
  },
};

export default nextConfig;
