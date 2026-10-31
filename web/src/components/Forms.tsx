import reviewData from "@/data/reviews.json";

/**
 * Forms are plain HTML posted to Netlify Forms (no JavaScript, no public email address).
 * Netlify finds them in the built pages; bot-field is a honeypot, so no CAPTCHA service is used.
 */
const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
const button = "rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700";

function FormShell({ name, children, submit }: { name: string; children: React.ReactNode; submit: string }) {
  return (
    <form name={name} method="POST" action="/thanks" data-netlify="true" netlify-honeypot="bot-field" className="space-y-3">
      <input type="hidden" name="form-name" value={name} />
      <p className="hidden"><label>Leave this empty: <input name="bot-field" /></label></p>
      {children}
      <button type="submit" className={button}>{submit}</button>
    </form>
  );
}

function Field({ label, name, type = "text", required = true, hint }: { label: string; name: string; type?: string; required?: boolean; hint?: string }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input type={type} name={name} required={required} className={input} />
      {hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}
    </label>
  );
}

export function ClaimForm({ slug, name }: { slug: string; name: string }) {
  return (
    <details className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
      <summary className="cursor-pointer font-medium text-slate-900">Own this business? Claim or correct this listing</summary>
      <p className="mt-3">
        Tell us what to fix on {name}&apos;s profile. We verify the request against your company website before
        publishing any change, and rankings are never for sale.
      </p>
      <div className="mt-4">
        <FormShell name="claim" submit="Send correction">
          <input type="hidden" name="msp" value={slug} />
          <Field label="Your name" name="name" />
          <Field label="Role at the company" name="role" />
          <Field label="Work email" name="email" type="email" hint="Used only to verify you; never shown on the site." />
          <label className="block text-sm font-medium text-slate-700">
            What should change?
            <textarea name="change" required rows={4} className={input} />
          </label>
        </FormShell>
      </div>
    </details>
  );
}

export type Review = { rating: number; text: string; author: string; role: string; date: string };

/** Approved reviews for a profile, copied from moderated submissions into web/src/data/reviews.json. */
export function reviewsFor(slug: string): Review[] {
  return ((reviewData as Record<string, Review[]>)[slug] ?? []);
}

export function Reviews({ slug, name }: { slug: string; name: string }) {
  const reviews = reviewsFor(slug);
  return (
    <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-base font-semibold">Reviews of {name} on MSP Hub</h2>
      {reviews.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">No reviews yet. Be the first client to share your experience.</p>
      ) : (
        <ul className="mt-3 space-y-4">
          {reviews.map((review) => (
            <li key={`${review.author}-${review.date}`} className="text-sm text-slate-700">
              <p className="font-medium text-slate-900">
                <span aria-label={`${review.rating} out of 5`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>{" "}
                {review.author}, {review.role} · {review.date}
              </p>
              <p className="mt-1">{review.text}</p>
            </li>
          ))}
        </ul>
      )}
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-medium text-brand-600">Write a review</summary>
        <p className="mt-3 text-slate-600">
          For current and former clients only. Reviews are checked before they appear: we confirm the reviewer&apos;s
          work email, reject reviews from the company&apos;s own staff, and never publish your email address.
        </p>
        <div className="mt-4">
          <FormShell name="review" submit="Submit review">
            <input type="hidden" name="msp" value={slug} />
            <label className="block text-sm font-medium text-slate-700">
              Rating
              <select name="rating" required className={input} defaultValue="">
                <option value="" disabled>Choose</option>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} out of 5</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Your experience
              <textarea name="review" required rows={5} minLength={80} className={input} />
              <span className="mt-1 block text-xs font-normal text-slate-500">At least 80 characters. Describe the work, not the price.</span>
            </label>
            <Field label="Your name" name="name" hint="Shown with the review, e.g. first name and last initial." />
            <Field label="Role and company type" name="role" hint='Shown with the review, e.g. "Office manager, dental practice".' />
            <Field label="Work email" name="email" type="email" hint="Used only to verify you; never shown." />
            <label className="block text-sm font-medium text-slate-700">
              Relationship
              <select name="relationship" required className={input} defaultValue="">
                <option value="" disabled>Choose</option>
                <option>Current client</option>
                <option>Former client</option>
              </select>
            </label>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" name="consent" required className="mt-1" />
              I am not employed by, or paid by, this company, and this review is my honest experience.
            </label>
          </FormShell>
        </div>
      </details>
    </section>
  );
}

export function ContactForm() {
  return (
    <FormShell name="contact" submit="Send message">
      <Field label="Your name" name="name" />
      <Field label="Email" name="email" type="email" />
      <label className="block text-sm font-medium text-slate-700">
        Topic
        <select name="topic" className={input} defaultValue="Listing correction">
          <option>Listing correction</option>
          <option>Add my company or metro</option>
          <option>Press or partnership</option>
          <option>Something else</option>
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Message
        <textarea name="message" required rows={5} className={input} />
      </label>
    </FormShell>
  );
}
