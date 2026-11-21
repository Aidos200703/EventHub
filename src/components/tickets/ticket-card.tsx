import QRCode from "qrcode";
import { CheckCircle2 } from "lucide-react";
import { cityName } from "@/lib/constants";
import { formatDateTime, formatLongDate, formatTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export function checkInUrl(code: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/organizer/check-in?code=${encodeURIComponent(code)}`;
}

type Props = {
  index: number;
  total: number;
  ticket: {
    code: string;
    status: "VALID" | "USED";
    checkedInAt: Date | null;
    ticketType: { name: string };
  };
  event: { title: string; startsAt: Date; venueName: string; venueAddress: string; city: string };
  orderNumber: string;
};

/**
 * Printable ticket. The QR encodes only a check-in URL with an opaque random code —
 * no name, email or phone — so a leaked screenshot reveals nothing personal.
 */
export async function TicketCard({ index, total, ticket, event, orderNumber }: Props) {
  const svg = await QRCode.toString(checkInUrl(ticket.code), {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#101010", light: "#ffffff" },
  });
  const used = ticket.status === "USED";
  return (
    <article
      className="grid overflow-hidden rounded-3xl bg-card ring-1 ring-border sm:grid-cols-[1fr_auto] print:break-inside-avoid"
      aria-label={`Ticket ${index} of ${total}: ${ticket.ticketType.name}`}
      data-testid="ticket"
    >
      <div className="grid content-between gap-6 p-6">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="lime">{ticket.ticketType.name}</Badge>
            <span className="text-xs font-semibold text-muted-foreground">
              Ticket {index} of {total}
            </span>
            {used && (
              <Badge variant="muted">
                <CheckCircle2 aria-hidden /> Used{" "}
                {ticket.checkedInAt && `· ${formatDateTime(ticket.checkedInAt)}`}
              </Badge>
            )}
          </div>
          <h3 className="text-2xl leading-tight font-bold">{event.title}</h3>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Date
            </dt>
            <dd className="font-semibold">{formatLongDate(event.startsAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Time
            </dt>
            <dd className="font-semibold">{formatTime(event.startsAt)}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Venue
            </dt>
            <dd className="font-semibold">
              {event.venueName}, {cityName(event.city)}
            </dd>
          </div>
        </dl>
        <p className="font-mono text-xs text-muted-foreground">Order {orderNumber}</p>
      </div>
      <div className="relative grid place-items-center gap-2 border-t-2 border-dashed bg-white p-6 sm:border-t-0 sm:border-l-2">
        <div
          className={used ? "size-40 opacity-30 grayscale" : "size-40"}
          role="img"
          aria-label="Ticket QR code for entry"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <p className="font-mono text-[11px] tracking-wider text-[#5c5d60] select-all">
          {ticket.code}
        </p>
      </div>
    </article>
  );
}
