const withPWA = require('@ducanh2912/next-pwa').default;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    runtimeCaching: [
      // API: nunca cachear (marcadores, ranking, sesión en vivo)
      {
        urlPattern: /^\/api\/.*/i,
        handler: 'NetworkOnly',
        options: { matchOptions: { ignoreSearch: false } },
      },
      // Assets estáticos de Next: cache first (versionados por hash)
      {
        urlPattern: /^\/_next\/static\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-static',
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      // Imágenes locales: cache first
      {
        urlPattern: /\.(?:png|jpg|jpeg|gif|svg|webp|ico)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      // Fuentes: cache first
      {
        urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'fonts',
          expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
      // Resto de páginas (HTML/datos dinámicos): nunca cachear
      {
        urlPattern: /.*/i,
        handler: 'NetworkOnly',
      },
    ],
  },
})(nextConfig);
