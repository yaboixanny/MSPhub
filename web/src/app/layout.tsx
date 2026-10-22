import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "MSP Hub: Find a Managed IT Service Provider Near You",
    template: "%s | MSP Hub",
  },
  description:
    "Compare managed service providers (MSPs) by city. Verified MSPs only, ranked by Google reviews, with services, industries and compliance support.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                M
              </span>
              MSP Hub
            </Link>
            <nav className="flex gap-5 text-sm text-slate-600">
              <Link href="/florida" className="hover:text-slate-900">
                Florida
              </Link>
              <Link href="/how-we-rank" className="hover:text-slate-900">
                How we rank
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mt-16 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500">
            <p className="font-medium text-slate-700">MSP Hub</p>
            <p className="mt-1">
              An independent directory of managed IT service providers. Ratings and review counts come
              from Google; services and specialties come from each provider&apos;s own website.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
