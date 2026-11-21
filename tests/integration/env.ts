// Loaded before any test module, so the Prisma client sees DATABASE_URL.
try {
  process.loadEnvFile();
} catch {
  // CI passes env vars directly
}
