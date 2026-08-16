import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": "http://127.0.0.1:9000",
      "/admin": "http://127.0.0.1:9000",
      "/media": "http://127.0.0.1:9000",
      "/static": "http://127.0.0.1:9000",
      "/ws": {
        target: "ws://127.0.0.1:9000",
        ws: true,
      },
    },
  },
});
