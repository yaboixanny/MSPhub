import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { getCoveredStates } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MSP Hub: Find a Managed IT Service Provider Near You",
    template: "%s | MSP Hub",
  },
  description:
    "Compare managed service providers (MSPs) by city. Verified MSPs only, with the services, industries and compliance support of each.",
  // Google Search Console ownership check; renders <meta name="google-site-verification">.
  verification: { google: "0tL9E0gmZPVhTfZxFmUCCHBPMnzztlBU1tEzTWakk3o" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const covered = getCoveredStates();
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
            <nav className="flex items-center gap-4 text-sm text-slate-600 sm:gap-6">
              <Link href="/united-states" className="hover:text-slate-900">
                Browse<span className="hidden sm:inline"> by state</span>
              </Link>
              <Link href="/how-we-rank" className="hidden hover:text-slate-900 sm:inline">
                How we rank
              </Link>
              <Link href="/about" className="hidden hover:text-slate-900 sm:inline">
                About
              </Link>
              <Link
                href="/search"
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.39l3.08 3.08a.75.75 0 11-1.06 1.06l-3.08-3.08A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
                Search
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mt-16 border-t border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm text-slate-500 sm:grid-cols-3">
            <div>
              <p className="font-semibold text-slate-800">MSP Hub</p>
              <p className="mt-2 leading-relaxed">
                An independent database of verified managed IT service providers. Company details come from each
                provider&apos;s own website.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Browse</p>
              <ul className="mt-2 space-y-1.5">
                {covered.flatMap((state) =>
                  state.cities.map((city) => (
                    <li key={`${state.slug}/${city.slug}`}>
                      <Link href={`/${state.slug}/${city.slug}`} className="hover:text-slate-900">
                        Best MSPs in {city.name}, {city.stateCode}
                      </Link>
                    </li>
                  )),
                )}
                <li>
                  <Link href="/united-states" className="hover:text-slate-900">All states</Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-800">About</p>
              <ul className="mt-2 space-y-1.5">
                <li><Link href="/about" className="hover:text-slate-900">About MSP Hub</Link></li>
                <li><Link href="/how-we-rank" className="hover:text-slate-900">How we rank MSPs</Link></li>
                <li><Link href="/search" className="hover:text-slate-900">Search the database</Link></li>
              </ul>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
