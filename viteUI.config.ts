import { resolve } from "path";
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), viteSingleFile()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "ui/index.html")
      }
    },
    emptyOutDir: false,
    outDir: "./dist/"
  }
});
