import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { utcToKzLocalInput } from "@/lib/dates";
import { publishBlockers } from "@/lib/validation/event";
import { requireOrganizer } from "@/server/session";
import { HttpError } from "@/server/http";
import { getOrganizerEvent } from "@/server/services/organizer";
import { PageHeader } from "@/components/organizer/page-header";
import { EventForm } from "@/components/organizer/event-form";
import { PublishControl } from "@/components/organizer/publish-control";

export const metadata: Metadata = { title: "Edit event" };

type Props = { params: Promise<{ id: string }> };

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;
  const user = await requireOrganizer(`/organizer/events/${id}/edit`);
  // Ownership is enforced inside the service: another organizer's event is a 404.
  const event = await getOrganizerEvent(user.id, id).catch((err) => {
    if (err instanceof HttpError && err.status === 404) notFound();
    throw err;
  });

  const blockers = publishBlockers({
    coverUrl: event.coverUrl,
    startsAt: event.startsAt,
    ticketTypeCount: event.ticketTypes.length,
  });

  return (
    <>
      <PageHeader
        title={event.title}
        description={`${event._count.orders} orders so far`}
        actions={<PublishControl eventId={event.id} status={event.status} blockers={blockers} />}
      />
      <EventForm
        mode="edit"
        eventId={event.id}
        soldByType={Object.fromEntries(event.ticketTypes.map((t) => [t.id, t.sold]))}
        defaults={{
          title: event.title,
          summary: event.summary,
          description: event.description,
          category: event.category,
          city: event.city as never,
          venueName: event.venueName,
          venueAddress: event.venueAddress,
          startsAt: utcToKzLocalInput(event.startsAt),
          endsAt: utcToKzLocalInput(event.endsAt),
          coverUrl: event.coverUrl,
          ticketTypes: event.ticketTypes.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description ?? "",
            price: t.price,
            quantity: t.quantity,
            maxPerOrder: t.maxPerOrder,
          })),
          program: event.program.map((p) => ({
            time: p.time,
            title: p.title,
            description: p.description ?? "",
          })),
        }}
      />
    </>
  );
}
