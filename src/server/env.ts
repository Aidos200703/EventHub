import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_DEMO_MODE: z.enum(["true", "false"]).default("false"),
  DEMO_PASSWORD: z.string().min(8).default("eventhub-demo"),
});

let cached: z.output<typeof envSchema> | undefined;

/** Validated server environment. Fails fast with a readable message when misconfigured. */
export function env() {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
    }
    cached = parsed.data;
  }
  return cached;
}

export const isDemoMode = () => process.env.NEXT_PUBLIC_DEMO_MODE === "true";
