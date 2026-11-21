import type { Metadata } from "next";
import { Suspense } from "react";
import { requireOrganizer } from "@/server/session";
import { listOrganizerEvents } from "@/server/services/organizer";
import { PageHeader } from "@/components/organizer/page-header";
import { OrdersTable } from "@/components/organizer/orders-table";

export const metadata: Metadata = { title: "Orders" };

export default async function OrganizerOrdersPage() {
  const user = await requireOrganizer("/organizer/orders");
  const events = await listOrganizerEvents(user.id);
  return (
    <>
      <PageHeader
        title="Orders"
        description="Every test order for your events. Amounts include the service fee paid by buyers."
      />
      <Suspense>
        <OrdersTable events={events.map((e) => ({ id: e.id, title: e.title }))} />
      </Suspense>
    </>
  );
}
