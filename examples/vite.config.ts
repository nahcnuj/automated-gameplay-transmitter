import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  // index.html and entry point (main.tsx) live in examples/layout/
  root: path.resolve(import.meta.dirname, "layout"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Resolve the library package name to the local source during development
      "automated-gameplay-transmitter": path.resolve(import.meta.dirname, "../index.ts"),
      // Ensure all React imports resolve to the same copy in examples/node_modules
      "react": path.resolve(import.meta.dirname, "node_modules/react"),
      "react-dom": path.resolve(import.meta.dirname, "node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(import.meta.dirname, "node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(import.meta.dirname, "node_modules/react/jsx-dev-runtime"),
    },
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
});
