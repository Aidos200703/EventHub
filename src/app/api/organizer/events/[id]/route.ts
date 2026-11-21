import { NextResponse } from "next/server";
import { readJson, withAuth } from "@/server/http";
import { deleteEvent, getOrganizerEvent, updateEvent } from "@/server/services/organizer";

type Params = { id: string };

export const GET = withAuth<Params>(
  async (_req, user, { id }) => NextResponse.json(await getOrganizerEvent(user.id, id)),
  {
    role: "ORGANIZER",
  },
);

export const PUT = withAuth<Params>(
  async (req, user, { id }) =>
    NextResponse.json(await updateEvent(user.id, id, await readJson(req))),
  {
    role: "ORGANIZER",
  },
);

export const DELETE = withAuth<Params>(
  async (_req, user, { id }) => {
    await deleteEvent(user.id, id);
    return new Response(null, { status: 204 });
  },
  { role: "ORGANIZER" },
);
