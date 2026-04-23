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
   plugins: [
     react(),
     VitePWA({
       registerType: "autoUpdate",
       includeAssets: ["favicon.ico", "robots.txt", "placeholder.svg"],
       manifest: {
         name: "Sistema de Leituras",
         short_name: "Leituras",
         description: "Sistema de gestão de leituras de máquinas",
         theme_color: "#ffffff",
         background_color: "#ffffff",
         display: "standalone",
         icons: [
           {
             src: "placeholder.svg",
             sizes: "192x192",
             type: "image/svg+xml",
             purpose: "any maskable",
           },
           {
             src: "placeholder.svg",
             sizes: "512x512",
             type: "image/svg+xml",
             purpose: "any maskable",
           },
         ],
       },
       workbox: {
         globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
         runtimeCaching: [
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
