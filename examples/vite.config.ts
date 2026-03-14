import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Resolve "automated-gameplay-transmitter" via its "source" export condition,
    // pointing to the TypeScript source (index.ts) for local development.
    conditions: ["source"],
    // Keep symlinks as-is so imports within the library source resolve
    // against examples/node_modules (where react lives).
    preserveSymlinks: true,
  },
});
