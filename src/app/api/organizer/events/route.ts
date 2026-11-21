import { NextResponse } from "next/server";
import { readJson, withAuth } from "@/server/http";
import { createEvent, listOrganizerEvents } from "@/server/services/organizer";

export const GET = withAuth(
  async (_req, user) => NextResponse.json({ events: await listOrganizerEvents(user.id) }),
  { role: "ORGANIZER" },
);

export const POST = withAuth(
  async (req, user) =>
    NextResponse.json(await createEvent(user.id, await readJson(req)), { status: 201 }),
  { role: "ORGANIZER" },
);
