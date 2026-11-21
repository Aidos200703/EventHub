import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireOrganizer } from "@/server/session";
import { listOrganizerEvents } from "@/server/services/organizer";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/organizer/page-header";
import { EventsTable } from "@/components/organizer/events-table";

export const metadata: Metadata = { title: "Events" };

export default async function OrganizerEventsPage() {
  const user = await requireOrganizer("/organizer/events");
  const events = await listOrganizerEvents(user.id);
  return (
    <>
      <PageHeader
        title="Events"
        description="Create, edit and publish your events."
        actions={
          <Button asChild variant="lime">
            <Link href="/organizer/events/new">
              <Plus /> New event
            </Link>
          </Button>
        }
      />
      <EventsTable initialEvents={events} />
    </>
  );
}
