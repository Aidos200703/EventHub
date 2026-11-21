"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, CircleAlert, ShieldX, UserCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import type { CheckInTicket } from "@/server/services/organizer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { QrScanner } from "./qr-scanner";
import { statsKey } from "./overview";

type Result =
  | { kind: "preview"; ticket: CheckInTicket }
  | { kind: "admitted"; ticket: CheckInTicket }
  | { kind: "already"; ticket: CheckInTicket }
  | { kind: "error"; message: string };

export function CheckIn({ initialCode }: { initialCode?: string }) {
  const qc = useQueryClient();
  const [code, setCode] = useState(initialCode ?? "");
  const [result, setResult] = useState<Result | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const lookup = useMutation({
    mutationFn: (value: string) =>
      api<{ ticket: CheckInTicket }>(`/api/organizer/check-in?code=${encodeURIComponent(value)}`),
    onSuccess: ({ ticket }) =>
      setResult(
        ticket.status === "USED" ? { kind: "already", ticket } : { kind: "preview", ticket },
      ),
    onError: (err) =>
      setResult({
        kind: "error",
        message: err instanceof ApiError ? err.message : "Lookup failed",
      }),
  });

  const admit = useMutation({
    mutationFn: (value: string) =>
      api<{ ticket: CheckInTicket; alreadyUsed: boolean }>("/api/organizer/check-in", {
        method: "POST",
        json: { code: value },
      }),
    onSuccess: ({ ticket, alreadyUsed }) => {
      setResult(alreadyUsed ? { kind: "already", ticket } : { kind: "admitted", ticket });
      if (!alreadyUsed) toast.success(`Admitted: ${ticket.ticketType}`);
      qc.invalidateQueries({ queryKey: statsKey });
      qc.invalidateQueries({ queryKey: ["organizer", "orders"] });
    },
    onError: (err) =>
      setResult({
        kind: "error",
        message: err instanceof ApiError ? err.message : "Check-in failed",
      }),
  });

  const run = (value: string) => {
    const v = value.trim();
    if (!v) return;
    setCode(v);
    lookup.mutate(v);
  };

  // A QR scanned by the phone's own camera app opens /organizer/check-in?code=… — look it up immediately.
  const didInit = useRef(false);
  useEffect(() => {
    if (initialCode && !didInit.current) {
      didInit.current = true;
      lookup.mutate(initialCode);
    }
  }, [initialCode, lookup]);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div className="grid content-start gap-6">
        <QrScanner onDetected={run} paused={lookup.isPending || admit.isPending} />
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(code);
          }}
        >
          <Label htmlFor="ticket-code">Or enter the code under the QR</Label>
          <div className="flex gap-2">
            <Input
              id="ticket-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. 3kq9…"
              className="font-mono"
              autoComplete="off"
            />
            <Button type="submit" loading={lookup.isPending}>
              Check
            </Button>
          </div>
        </form>
      </div>

      <div ref={resultRef} tabIndex={-1} aria-live="polite" className="outline-none">
        {!result ? (
          <div className="grid h-full min-h-60 place-items-center rounded-3xl border border-dashed p-8 text-center text-muted-foreground">
            Scan a ticket or enter its code to see who it belongs to.
          </div>
        ) : result.kind === "error" ? (
          <ResultCard tone="error" icon={<ShieldX />} title="Not admitted" text={result.message} />
        ) : (
          <ResultCard
            tone={
              result.kind === "admitted"
                ? "success"
                : result.kind === "already"
                  ? "warning"
                  : "neutral"
            }
            icon={
              result.kind === "admitted" ? (
                <CheckCircle2 />
              ) : result.kind === "already" ? (
                <CircleAlert />
              ) : (
                <UserCheck />
              )
            }
            title={
              result.kind === "admitted"
                ? "Admitted"
                : result.kind === "already"
                  ? "Already checked in"
                  : "Valid ticket"
            }
            text={
              result.kind === "already" && result.ticket.checkedInAt
                ? `Scanned ${formatDateTime(new Date(result.ticket.checkedInAt))}${result.ticket.checkedInBy ? ` by ${result.ticket.checkedInBy}` : ""}. Do not admit again.`
                : undefined
            }
          >
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Item label="Event" value={result.ticket.event.title} />
              <Item label="Ticket" value={result.ticket.ticketType} />
              <Item label="Holder" value={result.ticket.holder} />
              <Item label="Order" value={result.ticket.orderNumber} mono />
            </dl>
            {result.kind === "preview" && (
              <Button
                size="lg"
                variant="lime"
                className="mt-2 w-full sm:w-fit"
                loading={admit.isPending}
                onClick={() => admit.mutate(result.ticket.code)}
              >
                <UserCheck /> Mark as attended
              </Button>
            )}
          </ResultCard>
        )}
      </div>
    </div>
  );
}

function ResultCard({
  tone,
  icon,
  title,
  text,
  children,
}: {
  tone: "success" | "warning" | "error" | "neutral";
  icon: React.ReactNode;
  title: string;
  text?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "grid gap-4 rounded-3xl border-2 p-6 md:p-8",
        tone === "success" && "border-success bg-[#dff3e4]",
        tone === "warning" && "border-[#9a5b00] bg-[#fff0cc]",
        tone === "error" && "border-destructive bg-[#fde3df]",
        tone === "neutral" && "bg-card",
      )}
    >
      <div className="flex items-center gap-3 [&_svg]:size-8">
        {icon}
        <h2 className="text-3xl font-extrabold">{title}</h2>
      </div>
      {text && <p className="font-medium">{text}</p>}
      {children}
    </div>
  );
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-widest uppercase opacity-70">{label}</dt>
      <dd className={cn("font-semibold", mono && "font-mono")}>{value}</dd>
    </div>
  );
}
