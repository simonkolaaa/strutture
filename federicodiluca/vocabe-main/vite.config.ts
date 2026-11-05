import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// Served at the root of vocabe.federicodiluca.com (custom domain on GitHub Pages).
const base = '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Vocabe — una parola al giorno',
        short_name: 'Vocabe',
        description: 'Impara una parola italiana al giorno: significato, esempi e ripasso.',
        lang: 'it',
        // relative to the manifest's own URL, so it works under any base path
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#faf7f2',
        theme_color: '#1c1917',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        // The static SEO pages (/parole/*) and files like sitemap.xml / robots.txt are
        // generated after the build, so they aren't precached — keep the SPA's
        // navigation fallback from hijacking them for returning visitors.
        navigateFallbackDenylist: [/\/parole\//, /\.[a-z0-9]+$/i],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/parole/'),
            handler: 'NetworkFirst',
            options: { cacheName: 'seo-pages' },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
