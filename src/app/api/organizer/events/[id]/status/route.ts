import { NextResponse } from "next/server";
import { readJson, withAuth } from "@/server/http";
import { setEventStatus } from "@/server/services/organizer";

export const PATCH = withAuth<{ id: string }>(
  async (req, user, { id }) =>
    NextResponse.json(await setEventStatus(user.id, id, await readJson(req))),
  { role: "ORGANIZER" },
);
