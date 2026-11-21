import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";

export default function OrganizerNotFound() {
  return (
    <EmptyState
      icon={<SearchX />}
      title="Not found"
      description="This event doesn't exist or belongs to another organizer."
      action={
        <Button asChild>
          <Link href="/organizer/events">Back to my events</Link>
        </Button>
      }
    />
  );
}
