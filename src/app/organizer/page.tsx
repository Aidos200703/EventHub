import type { Metadata } from "next";
import { requireOrganizer } from "@/server/session";
import { getOrganizerStats, listOrganizerEvents } from "@/server/services/organizer";
import { PageHeader } from "@/components/organizer/page-header";
import { Overview, OverviewHeaderAction } from "@/components/organizer/overview";

export const metadata: Metadata = { title: "Overview" };

export default async function OrganizerOverviewPage() {
  const user = await requireOrganizer();
  const [stats, events] = await Promise.all([
    getOrganizerStats(user.id),
    listOrganizerEvents(user.id),
  ]);
  return (
    <>
      <PageHeader
        title={`Hi, ${user.name.split(" ")[0]}`}
        description="Here's how your events are selling."
        actions={<OverviewHeaderAction />}
      />
      <Overview stats={stats} events={events} />
    </>
  );
}
