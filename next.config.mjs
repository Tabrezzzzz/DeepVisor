/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        '127.0.0.1:3000',
        'm25fx3df-3000.inc1.devtunnels.ms',
        '*.devtunnels.ms',
      ],
    },
  },

  output: 'standalone', 
};

export default nextConfig;
