import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// `--mode site` builds the marketing site (src/site.tsx) for GitHub Pages,
// which includes the Home and Pulse Journal showcase pages but not the
// authenticated demo app.
export default defineConfig(({ mode }) => ({
  build: mode === "site" ? { outDir: "dist-site", rollupOptions: { input: "site.html" } } : {},
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
