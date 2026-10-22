import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-3 text-slate-600">That page doesn&apos;t exist, or the MSP is no longer listed.</p>
      <Link href="/" className="mt-6 inline-block text-brand-600 hover:underline">
        Back to MSP Hub
      </Link>
    </div>
  );
}
