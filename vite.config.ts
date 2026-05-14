 import legacy from "@vitejs/plugin-legacy";
 import { defineConfig } from "vite";
 import { VitePWA } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
    build: {
      target: ['es2018', 'chrome70', 'safari12'],
      cssTarget: ['chrome70', 'safari12'],
    },
    esbuild: {
      target: 'es2018',
    },
   plugins: [
     react(),
      legacy({
        targets: ['Android >= 7', 'Chrome >= 70', 'Safari >= 12', 'iOS >= 12'],
        additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
        modernPolyfills: true,
      }),
      VitePWA({
        registerType: "autoUpdate",
       devOptions: { enabled: false },
       includeAssets: ["favicon.ico", "robots.txt", "placeholder.svg"],
       manifest: {
         name: "GruaPro",
         short_name: "GruaPro",
         description: "Sistema de gestão de máquinas de pelúcias",
         theme_color: "#1E5BB8",
         background_color: "#1A1F2E",
         display: "standalone",
         icons: [
           {
             src: "logo.png",
             sizes: "512x512",
             type: "image/png",
             purpose: "any",
           },
         ],
       },
       workbox: {
         globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
         cleanupOutdatedCaches: true,
          skipWaiting: true,
         clientsClaim: true,
         navigateFallbackDenylist: [/^\/~oauth/, /^\/api/],
         runtimeCaching: [
           {
             urlPattern: ({ request }) => request.mode === "navigate",
             handler: "NetworkFirst",
             options: { cacheName: "html", networkTimeoutSeconds: 3 },
           },
           {
             urlPattern: ({ url }) => url.origin === "https://vtounmxbzqphtzegxzdi.supabase.co",
             handler: "NetworkFirst",
             options: {
               cacheName: "supabase-api-cache",
               expiration: {
                 maxEntries: 100,
                 maxAgeSeconds: 60 * 60 * 24, // 24 hours
               },
               cacheableResponse: {
                 statuses: [0, 200],
               },
             },
           },
         ],
       },
     }),
     mode === "development" && componentTagger(),
   ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
