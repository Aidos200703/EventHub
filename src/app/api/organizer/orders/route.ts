import { NextResponse } from "next/server";
import { withAuth } from "@/server/http";
import { listOrganizerOrders } from "@/server/services/organizer";

export const GET = withAuth(
  async (req, user) => {
    const params = Object.fromEntries(new URL(req.url).searchParams);
    return NextResponse.json(await listOrganizerOrders(user.id, params));
  },
  { role: "ORGANIZER" },
);
