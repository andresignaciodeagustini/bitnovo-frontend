// next.config.js
module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['payments.pre-bnvo.com', 'chart.googleapis.com'],
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};