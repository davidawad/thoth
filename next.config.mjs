/** @type {import('next').NextConfig} */
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to resolve module paths. Only ever called below with our
// own hardcoded literal module specifiers ("react/jsx-runtime" etc.), never
// with anything attacker/user-controlled - this runs at build-config time,
// not in a request handler.
const resolvePath = (modulePath) => {
  try {
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const pkgPath = path.resolve(__dirname, 'node_modules', modulePath);
    return pkgPath;
  } catch (e) {
    // nosemgrep: javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
    console.error(`Failed to resolve ${modulePath}:`, e);
    return modulePath;
  }
};

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // TypeScript 7 (the native Go port) doesn't expose the old tsserver-style
    // compiler API Next.js's build-time type-checker expects by default -
    // this flag switches Next to shelling out to the `tsc` CLI instead.
    useTypeScriptCli: true,
  },
  // Configure compilation for React 19
  compiler: {
    // Enable new React JSX transform
    emotion: false,
    styledComponents: true,
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  // Ensure React is properly loaded
  // Next.js 16 defaults `next build`/`next dev` to Turbopack, which doesn't
  // understand this custom webpack() config (and would hard-error). package.json
  // scripts pass --webpack explicitly to opt back into webpack, which this repo
  // needs anyway for babel.config.js (custom Babel, not SWC) support.
  webpack: (config, { isServer: _isServer }) => {
    // This allows Next.js to find React even with newer versions
    config.resolve.alias = {
      ...config.resolve.alias,
      'react/jsx-runtime': resolvePath('react/jsx-runtime'),
      'react/jsx-dev-runtime': resolvePath('react/jsx-dev-runtime'),
    };
    return config;
  },
};

export default nextConfig;
