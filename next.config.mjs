import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    inlineCss: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Todos los navegadores modernos (Baseline) soportan nativamente trimStart/flat/at/hasOwn
      config.resolve.alias[
        require.resolve('next/dist/build/polyfills/polyfill-module')
      ] = false;
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
