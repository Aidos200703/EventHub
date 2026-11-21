import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { getProfile } from "@/server/services/account";
import { formatLongDate } from "@/lib/format";
import { ProfileForm } from "@/components/account/profile-form";
import { SignOutButton } from "@/components/account/sign-out-button";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage() {
  const user = await requireUser("/account/settings");
  const profile = await getProfile(user.id);
  return (
    <div className="grid gap-8">
      <ProfileForm
        email={profile.email}
        defaults={{
          name: profile.name,
          phone: profile.phone ?? "",
          city: (profile.city ?? "") as "",
          bio: profile.bio ?? "",
        }}
      />
      <section
        className="grid max-w-2xl gap-3 rounded-3xl border p-6 md:p-8"
        aria-labelledby="session-title"
      >
        <h2 id="session-title" className="text-xl font-bold">
          Account
        </h2>
        <p className="text-sm text-muted-foreground">
          {profile.role === "ORGANIZER" ? "Organizer" : "Visitor"} account · member since{" "}
          {formatLongDate(profile.createdAt)}
        </p>
        <SignOutButton />
      </section>
    </div>
  );
}
