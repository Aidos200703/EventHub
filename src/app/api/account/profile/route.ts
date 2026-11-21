import { NextResponse } from "next/server";
import { readJson, withAuth } from "@/server/http";
import { updateProfile } from "@/server/services/account";

export const PATCH = withAuth(async (req, user) =>
  NextResponse.json(await updateProfile(user.id, await readJson(req))),
);
