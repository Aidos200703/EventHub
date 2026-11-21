import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { getCurrentUser } from "@/server/session";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});
const sans = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});
const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "EventHub — tickets to concerts, theatre & festivals in Kazakhstan",
    template: "%s · EventHub",
  },
  description:
    "Discover concerts, theatre, stand-up, conferences and festivals across Kazakhstan and book tickets in a minute.",
  applicationName: "EventHub",
  openGraph: { type: "website", siteName: "EventHub", locale: "en_KZ" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#17181a",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh font-sans">
        <a
          href="#main"
          className="sr-only z-[100] rounded-full bg-lime px-4 py-2 font-semibold text-black focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <Providers user={user}>{children}</Providers>
      </body>
    </html>
  );
}
