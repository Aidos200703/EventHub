import { NextResponse } from "next/server";
import { getEventCardsByIds, toCardDTO } from "@/server/services/events";

/** Public card data for a list of event ids (used by the favorites page). */
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("ids") ?? "";
  const ids = raw
    .split(",")
    .filter((id) => /^[a-z0-9]{6,40}$/i.test(id))
    .slice(0, 100);
  const cards = await getEventCardsByIds(ids);
  return NextResponse.json({ events: cards.map(toCardDTO) });
}
