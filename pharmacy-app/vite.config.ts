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
      "@validation": path.resolve(__dirname, "src/features/validation"),
      "@labels": path.resolve(__dirname, "src/features/labelgeneration"),
      "@refill": path.resolve(__dirname, "src/features/refillmanagement"),
      "@dispense": path.resolve(__dirname, "src/features/dispense"),
      "@history": path.resolve(__dirname, "src/features/refillmanagement"),
      "@assets": path.resolve(__dirname, "src/assets"),
      "@dashboard": path.resolve(__dirname, "src/features/dashboard"),
      "@audit": path.resolve(__dirname, "src/features/audit"),
      "@payment": path.resolve(__dirname, "src/features/payment"),
      "@inventory": path.resolve(__dirname, "src/features/inventory"),
      "@usermanagement": path.resolve(__dirname, "src/features/usermanagement"),
      "@constants":  path.resolve(__dirname, "src/constants"),
        "@routes":  path.resolve(__dirname, "src/routes"),
        "@styles":  path.resolve(__dirname, "src/styles"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,

    setupFiles: path.resolve(__dirname, "src/test/setup.ts"),

    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
  provider: "v8",
  reporter: ["text", "html", "lcov"],   // ← ADD THIS
  reportsDirectory: "coverage",        // ensure folder is correct
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
