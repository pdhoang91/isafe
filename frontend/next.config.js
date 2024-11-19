// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   // Các cấu hình khác
// };

// module.exports = nextConfig;


module.exports = {
  async headers() {
      return [
          {
              source: '/models/:path*',
              headers: [
                  { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
              ],
          },
      ];
  },
};
