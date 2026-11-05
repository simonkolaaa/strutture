import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readdirSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Content-Security-Policy: il browser carica ed esegue solo ciò che è elencato qui. Se uno
 * script riuscisse a entrare nella pagina (XSS) non potrebbe mandare il token Google altrove.
 * Sta in un <meta> perché GitHub Pages non permette header HTTP; solo nella build, perché il
 * server di sviluppo di Vite usa script inline che la policy bloccherebbe.
 */
const CSP = [
  "default-src 'self'",
  // Google Identity Services: lo script del login e il suo iframe.
  "script-src 'self' https://accounts.google.com/gsi/client",
  "frame-src https://accounts.google.com/gsi/",
  // API di Drive (compreso l'upload) e le chiamate interne del login.
  "connect-src 'self' https://www.googleapis.com https://accounts.google.com/gsi/",
  // Gli stili inline servono a Radix e sonner per posizionare menu e avvisi.
  "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
  "img-src 'self' data:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

function contentSecurityPolicy(): Plugin {
  return {
    name: 'profclick-csp',
    apply: 'build',
    transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }],
  }
}

/** Le guide (/guide/ e /guide/<argomento>/) sono pagine statiche come la landing: ogni cartella con un index.html è una pagina. */
function guidePages(): Record<string, string> {
  const root = fileURLToPath(new URL('./guide/', import.meta.url))
  const pages: Record<string, string> = { guide: root + 'index.html' }
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) pages[`guide-${entry.name}`] = `${root}${entry.name}/index.html`
  }
  return pages
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    contentSecurityPolicy(),
    // Solo l'app (/app/) è installabile e funziona offline; la pagina pubblica resta una
    // normale pagina web (ADR 0007).
    VitePWA({
      registerType: 'prompt',
      scope: '/app/',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: '/app/',
        name: 'ProfClick',
        short_name: 'ProfClick',
        description: 'Il piano di lavoro del docente, lezione per lezione.',
        lang: 'it',
        start_url: '/app/',
        scope: '/app/',
        display: 'standalone',
        background_color: '#f7faf8',
        theme_color: '#2f5b4f',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Il font ha file per ogni alfabeto; per l'italiano bastano latin e latin-ext.
        globIgnores: ['**/*-cyrillic*', '**/*-vietnamese*', '**/*-greek*', 'story.png', 'guide/**'],
        navigateFallback: '/app/index.html',
        navigateFallbackAllowlist: [/^\/app\//],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      input: {
        landing: fileURLToPath(new URL('./index.html', import.meta.url)),
        app: fileURLToPath(new URL('./app/index.html', import.meta.url)),
        ...guidePages(),
      },
    },
  },
  server: {
    // Google accetta il login solo dalle origini autorizzate, porta compresa.
    port: 5173,
    strictPort: true,
  },
})
