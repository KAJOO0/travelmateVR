import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // Preview links shared through a Cloudflare quick tunnel (https://*.trycloudflare.com).
  preview: { host: true, allowedHosts: ['.trycloudflare.com'] },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [
    react(),
    VitePWA({
      // Was 'prompt': a new service worker (and any server-side fix it carries, e.g. a CSP
      // header change) sat inactive behind a dismissible banner until a visitor happened to
      // click it — confirmed live as the cause of the OAuth callback still hitting a stale,
      // precached CSP after the header was already fixed server-side. 'autoUpdate' activates a
      // new worker (and reloads) as soon as one is found, no visitor action required.
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/*.png', 'brand/*.svg', 'offline.html'],
      manifest: {
        id: '/',
        name: 'TravelMateVR',
        short_name: 'TravelMateVR',
        description: 'Experience destinations in 360° before you go, plan with AI and book trusted tourism businesses.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0f2c3f',
        theme_color: '#0f2c3f',
        categories: ['travel', 'lifestyle'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        shortcuts: [
          { name: 'Explore destinations', url: '/destinations' },
          { name: 'My trips', url: '/trips' },
          { name: 'TravelMate AI', url: '/ai' }
        ]
      },
      workbox: {
        // New worker takes over immediately (together with registerType: 'autoUpdate' above)
        // instead of waiting for every open tab to close — otherwise the old worker keeps
        // serving its stale precached app shell (headers included) to any tab already open.
        skipWaiting: true,
        clientsClaim: true,
        // App shell + locale bundles are precached; media is cached on first view.
        globPatterns: ['**/*.{js,css,html,svg,woff2}', 'icons/*.png'],
        globIgnores: ['media/**', 'pano/**', 'video/**'],
        navigateFallback: '/index.html',
        // The Google/Cognito OAuth callback always lands here as `/?code=...&state=...` — a
        // real navigation, so without this the app-shell fallback above serves it from
        // whatever was precached at build/install time, headers and all, instead of a live
        // network response. Confirmed live: this is why a server-side CSP fix didn't take
        // effect for a visitor whose service worker predated it. Never cache this one.
        navigateFallbackDenylist: [/^\/api\//, /[?&]code=/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/media/') && url.pathname.endsWith('.webp'),
            handler: 'CacheFirst',
            options: { cacheName: 'tm-media', expiration: { maxEntries: 220, maxAgeSeconds: 60 * 60 * 24 * 30 } }
          },
          {
            // 360° panoramas are large: cache the ones a traveller has opened, keep a small set.
            urlPattern: ({ url }) => url.pathname.startsWith('/pano/'),
            handler: 'CacheFirst',
            options: { cacheName: 'tm-pano', expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 30 } }
          },
          {
            // 360° video posters only; the videos themselves stream from the network (range requests).
            urlPattern: ({ url }) => url.pathname.startsWith('/video/') && url.pathname.endsWith('.jpg'),
            handler: 'CacheFirst',
            options: { cacheName: 'tm-video-poster', expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 30 } }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: { cacheName: 'tm-api', networkTimeoutSeconds: 6, expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 7 } }
          }
        ]
      },
      devOptions: { enabled: false }
    })
  ],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (/node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'react';
          if (/node_modules[\\/](i18next|react-i18next|i18next-browser-languagedetector)[\\/]/.test(id)) return 'i18n';
          return undefined;
        }
      }
    }
  }
});
