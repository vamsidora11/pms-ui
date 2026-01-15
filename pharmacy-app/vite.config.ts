/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@components": path.resolve(__dirname, "src/components"),
      "@store": path.resolve(__dirname, "src/store"),
      "@api": path.resolve(__dirname, "src/api"),
      "@utils": path.resolve(__dirname, "src/utils"),
      "@types": path.resolve(__dirname, "src/types"),
      "@auth": path.resolve(__dirname, "src/features/auth"),
      "@patient": path.resolve(__dirname, "src/features/patient"),
      "@prescription": path.resolve(__dirname, "src/features/prescription"),
      "@assets": path.resolve(__dirname, "src/assets")
    },
  },
  test: {
    environment: "jsdom",
    globals: true,

    setupFiles: path.resolve(__dirname, "src/test/setup.ts"),

    include: ["src/**/*.{test,spec}.{ts,tsx}"],

    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/node_modules/**",
        "**/main.tsx",
        "**/App.tsx",
        "**/routes/**",
        "**/api/**",
        "**/*.d.ts",
      ],
    },
  },
});
