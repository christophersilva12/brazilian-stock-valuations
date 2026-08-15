import { defineConfig } from "vite";
import path from "path";
import { marketApiPlugin } from "./vite/market-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [marketApiPlugin()],
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
