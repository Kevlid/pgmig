import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/**/*.ts"],
    format: ["cjs", "esm"],
    outDir: "dist",
    dts: true,
    clean: true,
    sourcemap: true,
    minify: false,
    splitting: false,
    treeshake: true,
    target: "es2020",
    keepNames: true,
});
