"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EyeOff, Rocket } from "lucide-react";
import { api } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialogs";
import { eventsKey, statsKey } from "./overview";

export function PublishControl({
  eventId,
  status,
  blockers,
}: {
  eventId: string;
  status: "DRAFT" | "PUBLISHED";
  blockers: string[];
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (next: "DRAFT" | "PUBLISHED") =>
      api(`/api/organizer/events/${eventId}/status`, { method: "PATCH", json: { status: next } }),
    onSuccess: (_d, next) => {
      toast.success(next === "PUBLISHED" ? "Event is live" : "Moved to drafts");
      qc.invalidateQueries({ queryKey: eventsKey });
      qc.invalidateQueries({ queryKey: statsKey });
      router.refresh();
    },
    onError: (err) => toast.error("Status not changed", { description: err.message }),
  });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant={status === "PUBLISHED" ? "success" : "muted"}>
        {status === "PUBLISHED" ? "Published" : "Draft"}
      </Badge>
      {status === "DRAFT" ? (
        <Button
          variant="lime"
          loading={mutation.isPending}
          disabled={blockers.length > 0}
          title={blockers.length ? blockers.join(", ") : undefined}
          onClick={() => mutation.mutate("PUBLISHED")}
        >
          <Rocket /> Publish
        </Button>
      ) : (
        <ConfirmDialog
          title="Unpublish this event?"
          description="It will disappear from the catalog and nobody will be able to buy tickets. Existing tickets stay valid."
          confirmLabel="Unpublish"
          onConfirm={() => mutation.mutate("DRAFT")}
          trigger={
            <Button variant="outline" loading={mutation.isPending}>
              <EyeOff /> Unpublish
            </Button>
          }
        />
      )}
      {status === "DRAFT" && blockers.length > 0 && (
        <p className="text-sm text-muted-foreground">
          To publish: {blockers.join(", ").toLowerCase()}.
        </p>
      )}
    </div>
  );
}
