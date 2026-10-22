export function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  const percent = Math.max(0, Math.min(100, (rating / 5) * 100));
  const row = (className: string) => (
    <span className={`flex ${className}`} aria-hidden>
      {Array.from({ length: 5 }, (_, index) => (
        <svg key={index} width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </span>
  );
  return (
    <span className="relative inline-flex" role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {row("text-slate-200")}
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${percent}%` }}>
        {row("text-star")}
      </span>
    </span>
  );
}

/**
 * Attribution required wherever Google Places data is shown without a Google map:
 * the words "Google Maps" (not localized) in Roboto 400, 12-16px, colored #5E5E5E.
 */
export function GoogleMapsAttribution() {
  return (
    <span className="font-roboto text-xs whitespace-nowrap text-[#5E5E5E]" translate="no">
      Google Maps
    </span>
  );
}

export function Rating({
  rating,
  reviewCount,
  size,
}: {
  rating: number | null;
  reviewCount: number;
  size?: number;
}) {
  if (rating === null || reviewCount === 0) {
    return <span className="text-sm text-slate-500">No reviews on Google Maps yet</span>;
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
      <span className="font-semibold text-slate-900">{rating.toFixed(1)}</span>
      <Stars rating={rating} size={size} />
      <span className="text-slate-500">
        {reviewCount.toLocaleString()} review{reviewCount === 1 ? "" : "s"}
      </span>
      <GoogleMapsAttribution />
    </span>
  );
}
