import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "VISITOR" | "ORGANIZER";
};

/** Session lookup deduplicated per request via React cache(). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email, role } = session.user as typeof session.user & { role?: string };
  return { id, name, email, role: role === "ORGANIZER" ? "ORGANIZER" : "VISITOR" };
});

export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  return user;
}

export async function requireOrganizer(returnTo = "/organizer"): Promise<CurrentUser> {
  const user = await requireUser(returnTo);
  if (user.role !== "ORGANIZER") redirect("/account?notice=organizer-only");
  return user;
}
