import { resolve } from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "plugin-src/code.ts"),
      name: "code",
      // the proper extensions will be added
      fileName: "code",
      formats: ["cjs"]
    },
    outDir: "./"
  }
});
