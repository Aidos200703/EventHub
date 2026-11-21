import Link from "next/link";
import { CATEGORIES, CITIES } from "@/lib/constants";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="surface-dark mt-24 bg-background">
      <div className="container-page grid gap-12 py-16 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="grid content-start gap-4">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">
            Tickets to concerts, theatre, stand-up, conferences and festivals across Kazakhstan.
            Portfolio project — payments are simulated and no real money is ever charged.
          </p>
        </div>
        <FooterCol title="Discover">
          <FooterLink href="/events">All events</FooterLink>
          <FooterLink href="/events?date=weekend">This weekend</FooterLink>
          <FooterLink href="/events?sort=popular">Most popular</FooterLink>
          <FooterLink href="/favorites">Favorites</FooterLink>
        </FooterCol>
        <FooterCol title="Categories">
          {CATEGORIES.slice(0, 5).map((c) => (
            <FooterLink key={c.slug} href={`/events?category=${c.slug}`}>
              {c.label}
            </FooterLink>
          ))}
        </FooterCol>
        <FooterCol title="Cities">
          {CITIES.slice(0, 5).map((c) => (
            <FooterLink key={c.slug} href={`/events?city=${c.slug}`}>
              {c.name}
            </FooterLink>
          ))}
        </FooterCol>
      </div>
      <div className="border-t">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} EventHub</p>
          <p>
            For organizers:{" "}
            <Link
              className="underline underline-offset-4 hover:text-foreground"
              href="/sign-up?role=organizer"
            >
              sell tickets on EventHub
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 font-sans text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        {title}
      </h2>
      <ul className="grid gap-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm transition hover:text-lime">
        {children}
      </Link>
    </li>
  );
}
