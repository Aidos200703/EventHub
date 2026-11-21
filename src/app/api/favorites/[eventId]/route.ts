import { withAuth } from "@/server/http";
import { addFavorite, removeFavorite } from "@/server/services/favorites";

type Params = { eventId: string };

export const PUT = withAuth<Params>(async (_req, user, { eventId }) => {
  await addFavorite(user.id, eventId);
  return new Response(null, { status: 204 });
});

export const DELETE = withAuth<Params>(async (_req, user, { eventId }) => {
  await removeFavorite(user.id, eventId);
  return new Response(null, { status: 204 });
});
