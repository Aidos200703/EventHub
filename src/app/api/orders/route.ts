import { NextResponse } from "next/server";
import { readJson, withAuth } from "@/server/http";
import { createOrder } from "@/server/services/orders";

export const POST = withAuth(async (req, user) => {
  const result = await createOrder(user.id, await readJson(req));
  // 200 for a replayed (idempotent) request, 201 for a fresh order.
  return NextResponse.json(result, { status: result.replayed ? 200 : 201 });
});
