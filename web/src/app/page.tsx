import Link from "next/link";
import { getAllMsps, getStates } from "@/lib/data";

export default function Home() {
  const states = getStates();
  const msps = getAllMsps();
  const reviews = msps.reduce((sum, msp) => sum + msp.reviewCount, 0);

  return (
    <>
      <section className="border-b border-slate-200 bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="text-sm font-medium text-brand-700">The directory of managed IT providers</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Find a managed IT service provider you can trust
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            Compare MSPs in your city by real Google reviews, the services they offer, the industries they know and
            the compliance frameworks they support. Every listing is checked to make sure it&apos;s a real MSP.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {states.flatMap((state) =>
              state.cities.map((city) => (
                <Link
                  key={`${state.slug}/${city.slug}`}
                  href={`/${state.slug}/${city.slug}`}
                  className="rounded-lg bg-brand-600 px-5 py-3 font-medium text-white hover:bg-brand-700"
                >
                  Browse {city.count} MSPs in {city.name}, {city.stateCode}
                </Link>
              )),
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <dl className="grid gap-4 sm:grid-cols-3">
          {[
            [msps.length.toString(), "verified MSPs"],
            [reviews.toLocaleString(), "Google reviews factored into rankings"],
            [states.reduce((sum, state) => sum + state.cities.length, 0).toString(), "cities covered, with more coming"],
          ].map(([value, text]) => (
            <div key={text} className="rounded-xl border border-slate-200 bg-white p-6">
              <dt className="text-3xl font-bold">{value}</dt>
              <dd className="mt-1 text-slate-600">{text}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {[
            ["Only real MSPs", "We read every provider's website and leave out repair shops, web agencies and one-off contractors."],
            ["Fair rankings", "Ratings are weighted by review count, so a handful of five-star reviews can't outrank a long track record."],
            ["Filter by what you need", "Narrow providers by service, industry and compliance needs like HIPAA or CMMC."],
          ].map(([title, text]) => (
            <div key={title}>
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-2 leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
