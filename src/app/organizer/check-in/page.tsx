import type { Metadata } from "next";
import { PageHeader } from "@/components/organizer/page-header";
import { CheckIn } from "@/components/organizer/check-in";

export const metadata: Metadata = { title: "Check-in" };

type Props = { searchParams: Promise<{ code?: string }> };

export default async function CheckInPage({ searchParams }: Props) {
  const { code } = await searchParams;
  return (
    <>
      <PageHeader
        title="Check-in"
        description="Scan tickets at the door. Only tickets for your own events can be checked in."
      />
      <CheckIn initialCode={code} />
    </>
  );
}
