import Link from "next/link";
import { CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";

export default function EventNotFound() {
  return (
    <div className="container-page py-20">
      <EmptyState
        icon={<CalendarX />}
        title="This event isn't available"
        description="It may have been unpublished by the organizer, or the link is wrong."
        action={
          <Button asChild>
            <Link href="/events">Browse events</Link>
          </Button>
        }
      />
    </div>
  );
}
