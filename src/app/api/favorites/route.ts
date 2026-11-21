import { NextResponse } from "next/server";
import { readJson, withAuth } from "@/server/http";
import { listFavoriteIds, mergeFavorites } from "@/server/services/favorites";

export const GET = withAuth(async (_req, user) =>
  NextResponse.json({ ids: await listFavoriteIds(user.id) }),
);

/** Merge guest favorites (from localStorage) into the account after sign-in. */
export const POST = withAuth(async (req, user) =>
  NextResponse.json(await mergeFavorites(user.id, await readJson(req))),
);
