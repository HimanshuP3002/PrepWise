import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/auth": "http://localhost:5000",
      "/vote": "http://localhost:5000",
      "/count": "http://localhost:5000",
      "/analytics": "http://localhost:5000",
      "/health": "http://localhost:5000"
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
