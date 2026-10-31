import notes from "@/data/market_notes.json";

type Note = { count: number; overview: string; questions: string[] };

/** The Claude-written metro note (scripts/market_notes.py); ignored once the metro's MSP count has changed. */
export function marketNote(state: string, city: string, count: number): Note | undefined {
  const note = (notes as Record<string, Note>)[`${state}/${city}`];
  return note && note.count === count ? note : undefined;
}

/** Original, number-backed commentary for a metro page: how it differs from the directory, plus questions to ask. */
export function MarketNotes({ place, differences, note }: { place: string; differences: string[]; note?: Note }) {
  if (differences.length === 0 && !note) return null;
  return (
    <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-2xl font-bold tracking-tight">What to know before hiring an MSP in {place}</h2>
      {note && <p className="mt-3 max-w-3xl leading-relaxed text-slate-700">{note.overview}</p>}
      {differences.length > 0 && (
        <>
          <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">How {place} differs</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
            {differences.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </>
      )}
      {note && (
        <>
          <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">Questions worth asking</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
            {note.questions.map((question) => <li key={question}>{question}</li>)}
          </ul>
        </>
      )}
      <p className="mt-4 text-xs text-slate-500">
        Based on what providers say on their own websites, compared across MSP Hub&apos;s listings. Verify claims directly with any provider.
      </p>
    </section>
  );
}

/** How a profile compares with the rest of its metro, from MSP Hub's data. */
export function HowItCompares({ name, place, lines }: { name: string; place: string; lines: string[] }) {
  if (lines.length < 2) return null;
  return (
    <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-base font-semibold">How {name} compares in {place}</h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
        {lines.map((line) => <li key={line}>{line}</li>)}
      </ul>
    </section>
  );
}
