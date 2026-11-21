import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const alias = {
  "@": path.resolve(import.meta.dirname, "src"),
  // `server-only` throws outside the react-server condition; in tests it is a no-op.
  "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
};

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          globals: true,
          include: ["tests/unit/**/*.test.{ts,tsx}"],
          setupFiles: ["tests/setup.ts"],
          css: false,
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          globals: true,
          include: ["tests/integration/**/*.test.ts"],
          setupFiles: ["tests/integration/env.ts"],
          // Tests share one database; run files sequentially.
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 30_000,
        },
      },
    ],
  },
});
