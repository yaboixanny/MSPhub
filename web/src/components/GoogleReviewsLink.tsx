/**
 * A plain link that searches Google Maps for the company, so visitors can read its
 * reviews there. It's an ordinary hyperlink: no Google API is called and nothing
 * from Google is shown or stored on MSP Hub.
 */
export function GoogleReviewsLink({ name, location }: { name: string; location: string }) {
  const query = encodeURIComponent(`${name}, ${location}`);
  return (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${query}`}
      target="_blank"
      rel="noopener nofollow"
      className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
    >
      Find {name} reviews on Google
      <span aria-hidden>↗</span>
    </a>
  );
}
