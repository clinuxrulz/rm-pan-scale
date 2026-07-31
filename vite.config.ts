import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "src/rm-pan-scale.ts",
      name: "rm-pan-scale",
      fileName: "rm-pan-scale",
      formats: ["es"],
    },
    rollupOptions: {
      external: [],
    },
  },
  plugins: [
    dts({
      include: ["src/**/*.ts", "!src/**/*.test.ts"],
      outDir: "dist",
      bundleTypes: true,
    }),
  ],
});
