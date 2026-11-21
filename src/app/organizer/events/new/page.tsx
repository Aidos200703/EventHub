import type { Metadata } from "next";
import { utcToKzLocalInput } from "@/lib/dates";
import { PageHeader } from "@/components/organizer/page-header";
import { EventForm, emptyTicketType } from "@/components/organizer/event-form";

export const metadata: Metadata = { title: "New event" };

/** Sensible defaults: two weeks from now, 19:00–22:00 Kazakhstan time. */
function defaultDay() {
  return utcToKzLocalInput(new Date(Date.now() + 14 * 86_400_000)).slice(0, 10);
}

export default function NewEventPage() {
  const day = defaultDay();
  return (
    <>
      <PageHeader
        title="New event"
        description="It's saved as a draft first — only you can see it until you publish."
      />
      <EventForm
        mode="create"
        defaults={{
          title: "",
          summary: "",
          description: "",
          category: "" as never,
          city: "" as never,
          venueName: "",
          venueAddress: "",
          startsAt: `${day}T19:00`,
          endsAt: `${day}T22:00`,
          coverUrl: null,
          ticketTypes: [{ ...emptyTicketType, name: "General admission" }],
          program: [],
        }}
      />
    </>
  );
}
