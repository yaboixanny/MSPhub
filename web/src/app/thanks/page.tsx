import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Thanks", robots: { index: false, follow: false } };

export default function ThanksPage() {
  return (
    <article className="mx-auto max-w-xl px-4 py-16 text-center text-slate-700">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Thanks, we got it</h1>
      <p className="mt-4">We read every submission and check changes against the company&apos;s website before publishing.</p>
      <Link href="/" className="mt-6 inline-block text-brand-600 hover:underline">Back to MSP Hub</Link>
    </article>
  );
}
