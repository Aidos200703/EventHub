import { defineConfig } from "prisma/config";

// Prisma 7 no longer loads .env automatically; Node's built-in loader keeps us dependency-free.
try {
  process.loadEnvFile();
} catch {
  // .env is optional (CI provides variables directly)
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
