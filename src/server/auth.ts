import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./db";
import { env } from "./env";

const ROLES = ["VISITOR", "ORGANIZER"] as const;

/**
 * Better Auth: email + password, database sessions (httpOnly cookie), stored via Prisma.
 * The role is chosen at sign-up and can never be changed through the auth API.
 */
export const auth = betterAuth({
  secret: env().BETTER_AUTH_SECRET,
  baseURL: env().BETTER_AUTH_URL,
  trustedOrigins: [env().NEXT_PUBLIC_APP_URL, env().BETTER_AUTH_URL],
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "VISITOR", input: true },
      phone: { type: "string", required: false, input: false },
      city: { type: "string", required: false, input: false },
      bio: { type: "string", required: false, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: process.env.NODE_ENV === "production" && process.env.E2E !== "1",
    window: 60,
    max: 30,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const role = ROLES.includes(user.role as (typeof ROLES)[number]) ? user.role : "VISITOR";
          return { data: { ...user, role } };
        },
      },
      update: {
        before: async (data) => {
          // Privilege escalation guard: role is not updatable through the auth API.
          const { role: _ignored, ...rest } = data as Record<string, unknown>;
          return { data: rest };
        },
      },
    },
  },
  plugins: [nextCookies()],
});
