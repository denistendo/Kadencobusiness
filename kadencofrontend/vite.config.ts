import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(({ mode }) => ({
  base: "/",

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
      manifest: {
        name: "Kadenco Business Hub",
        short_name: "Kadenco",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [
          {
            src: "/favicon.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/favicon.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));