import type { Metadata } from "next";
import { ContactForm } from "@/components/Forms";

export const metadata: Metadata = {
  title: "Contact MSP Hub",
  description: "Send MSP Hub a correction, ask to add your company or a metro, or get in touch.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <article className="mx-auto max-w-xl px-4 py-12 leading-relaxed text-slate-700">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Contact MSP Hub</h1>
      <p className="mt-4">
        Use this form for corrections, to ask for your company or metro to be added, or anything else. To fix a
        specific profile, use &ldquo;Claim or correct this listing&rdquo; on that profile.
      </p>
      <div className="mt-6"><ContactForm /></div>
    </article>
  );
}
