import type { Metadata } from "next";
import { requireOrganizer } from "@/server/session";
import { OrganizerSidebar, OrganizerTopbar } from "@/components/organizer/organizer-nav";

export const metadata: Metadata = {
  title: { default: "Organizer", template: "%s · Organizer · EventHub" },
  robots: { index: false },
};

export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOrganizer();
  return (
    <div className="flex min-h-dvh bg-background">
      <OrganizerSidebar user={user} />
      <div className="min-w-0 flex-1">
        <OrganizerTopbar user={user} />
        <main
          id="main"
          className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-10 lg:py-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
