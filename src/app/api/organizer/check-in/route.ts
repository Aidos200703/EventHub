import { NextResponse } from "next/server";
import { readJson, withAuth } from "@/server/http";
import { checkInTicket, lookupTicket } from "@/server/services/organizer";

/** Look up a ticket without changing it (preview before admitting). */
export const GET = withAuth(
  async (req, user) =>
    NextResponse.json({
      ticket: await lookupTicket(user.id, {
        code: new URL(req.url).searchParams.get("code") ?? "",
      }),
    }),
  { role: "ORGANIZER" },
);

/** Mark a ticket as used. Responds with alreadyUsed=true when it had been scanned before. */
export const POST = withAuth(
  async (req, user) => NextResponse.json(await checkInTicket(user.id, await readJson(req))),
  {
    role: "ORGANIZER",
  },
);
