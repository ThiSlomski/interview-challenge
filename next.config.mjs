/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async headers() {
    return [{ source: '/:path*', headers: [{
      key: 'Content-Security-Policy',
      value: "connect-src 'self' https://geocoding-api.open-meteo.com https://api.open-meteo.com",
    }] }];
  },
};

export default nextConfig;
