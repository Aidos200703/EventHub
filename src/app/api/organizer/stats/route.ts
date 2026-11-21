import { NextResponse } from "next/server";
import { withAuth } from "@/server/http";
import { getOrganizerStats } from "@/server/services/organizer";

export const GET = withAuth(
  async (_req, user) => NextResponse.json(await getOrganizerStats(user.id)),
  { role: "ORGANIZER" },
);
