/**
 * "Best MSPs in <place>" SEO conventions, shared by every location page so new
 * cities and towns get them automatically. See CLAUDE.md for the rules.
 */
import type { City, Msp } from "@/lib/data";
import { INDUSTRY_LABELS, SERVICE_LABELS, label } from "@/lib/labels";
import { CORE_SERVICES } from "@/lib/score";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Data freshness for titles and "Updated" labels, from the newest city update. */
export function freshness(cities: City[]) {
  const latest = cities.map((city) => city.updated).sort().at(-1) ?? "2026-01-01";
  const [year, month] = latest.split("-").map(Number);
  return { year, label: `${MONTHS[month - 1]} ${year}`, iso: latest };
}

/** e.g. "Best MSPs in Orlando, FL (2026): 111 Managed IT Providers Ranked" */
export function bestTitle(place: string, count: number, year: number) {
  return `Best MSPs in ${place} (${year}): ${count} Managed IT ${count === 1 ? "Provider" : "Providers"} Ranked`;
}

export function bestDescription(place: string, count: number, year: number) {
  return `The best managed service providers in ${place} for ${year}, ranked. Compare ${count} verified MSPs by services, industries, compliance support and live Google reviews.`;
}

/** How many entries the "Top" list shows: 10 for bigger lists, 5 for small ones, none for tiny ones. */
export function topCount(total: number) {
  return total >= 15 ? 10 : total >= 6 ? 5 : 0;
}

function joinWords(words: string[]) {
  return words.length <= 1 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`;
}

/** Up to three short, data-backed reasons an MSP ranks where it does. */
export function rankReasons(msp: Msp, asOfYear: number): string[] {
  const reasons: string[] = [];
  if (msp.foundedYear) reasons.push(`In business since ${msp.foundedYear} (${asOfYear - msp.foundedYear} years)`);
  if (msp.compliance.length) reasons.push(`Supports ${joinWords(msp.compliance.slice(0, 2))}`);
  const core = msp.services.filter((service) => CORE_SERVICES.includes(service)).length;
  if (core >= 7) reasons.push(`Offers ${core} of 8 core managed services`);
  if (msp.pricing) reasons.push("Publishes its pricing");
  if (msp.industries.length >= 2) {
    reasons.push(`Serves ${joinWords(msp.industries.slice(0, 2).map((value) => label(INDUSTRY_LABELS, value).toLowerCase()))}`);
  }
  if (msp.partners.length) reasons.push(`Partners: ${msp.partners.slice(0, 2).join(", ")}`);
  return reasons.slice(0, 3);
}

export type Faq = { question: string; answer: string };

function countBy(items: Msp[], test: (msp: Msp) => boolean) {
  return items.filter(test).length;
}

/** Location FAQs generated from the listings, so every city and town gets its own answers. */
export function locationFaqs(place: string, msps: Msp[], areas: { name: string; count: number }[] = []): Faq[] {
  if (msps.length === 0) return [];
  const faqs: Faq[] = [];
  const top = msps.slice(0, 3);
  // Later answers name different providers where possible, so the FAQs don't
  // repeat the same three names.
  const mentioned = new Set(top.map((msp) => msp.slug));
  const pickNew = (matching: Msp[]) => {
    const fresh = matching.filter((msp) => !mentioned.has(msp.slug));
    const picked = (fresh.length >= 3 ? fresh : matching).slice(0, 3);
    picked.forEach((msp) => mentioned.add(msp.slug));
    return joinWords(picked.map((msp) => msp.name));
  };
  faqs.push({
    question: `Who are the best MSPs in ${place}?`,
    answer: `Ranked by the MSP Hub Score, the top MSPs in ${place} are ${joinWords(top.map((msp) => `${msp.name} (${msp.score.total}/100)`))}. The score reflects years in business, managed services coverage, compliance support, industries served and pricing transparency, as documented on each provider's website. Every profile also shows the provider's live Google reviews.`,
  });

  const townText = areas.length > 1
    ? `, based in towns including ${joinWords(areas.slice(0, 3).map((area) => `${area.name} (${area.count})`))}`
    : "";
  faqs.push({
    question: `How many managed service providers are in ${place}?`,
    answer: `MSP Hub lists ${msps.length} verified MSPs in ${place}${townText}. Each one was checked against its own website to confirm it offers ongoing managed IT for businesses, not just repairs or one-off projects.`,
  });

  for (const framework of ["HIPAA", "CMMC"]) {
    const matching = msps.filter((msp) => msp.compliance.includes(framework));
    if (matching.length >= 2) {
      faqs.push({
        question: `Which MSPs in ${place} support ${framework} compliance?`,
        answer: `${matching.length} of ${msps.length} MSPs in ${place} say they help clients meet ${framework}, including highly ranked providers ${pickNew(matching)}.`,
      });
    }
  }

  const industryCounts = new Map<string, number>();
  for (const msp of msps) for (const value of msp.industries) industryCounts.set(value, (industryCounts.get(value) ?? 0) + 1);
  const [topIndustry] = [...industryCounts.entries()].sort((a, b) => b[1] - a[1]);
  if (topIndustry && topIndustry[1] >= 2) {
    const name = label(INDUSTRY_LABELS, topIndustry[0]).toLowerCase();
    const matching = msps.filter((msp) => msp.industries.includes(topIndustry[0]));
    faqs.push({
      question: `Which MSPs in ${place} work with ${name} businesses?`,
      answer: `${matching.length} MSPs in ${place} name ${name} as an industry they serve, including highly ranked providers ${pickNew(matching)}.`,
    });
  }

  const priced = msps.filter((msp) => msp.pricing);
  if (priced.length >= 2) {
    const perUser = countBy(priced, (msp) => /per[- ]?(user|seat|employee)/i.test(msp.pricing!));
    const perDevice = countBy(priced, (msp) => /per[- ]?(device|endpoint|computer|workstation)/i.test(msp.pricing!));
    const flat = countBy(priced, (msp) => /flat|fixed/i.test(msp.pricing!));
    const models = [
      [perUser, "per-user monthly pricing"],
      [perDevice, "per-device pricing"],
      [flat, "flat or fixed monthly fees"],
    ].filter(([count]) => (count as number) > 0).sort((a, b) => (b[0] as number) - (a[0] as number));
    const modelText = models.length
      ? ` The most common approaches are ${joinWords(models.map(([count, text]) => `${text} (${count})`))}.`
      : "";
    faqs.push({
      question: `How much do managed IT services cost in ${place}?`,
      answer: `${priced.length} of ${msps.length} MSPs in ${place} describe their pricing publicly.${modelText} Exact prices depend on the number of users and devices and the services included, so ask two or three providers for quotes.`,
    });
  }
  return faqs;
}


/** Profile FAQs built from the MSP's own data, so each profile answers its own questions. */
export function profileFaqs(msp: Msp, city: City, rank: number, place: string): Faq[] {
  const faqs: Faq[] = [];
  const services = msp.services.map((value) => label(SERVICE_LABELS, value).toLowerCase());
  faqs.push({
    question: `What services does ${msp.name} offer?`,
    answer: `${msp.name} is a managed service provider based in ${place}. Its website lists ${joinWords(services)}.`,
  });
  if (msp.compliance.length) {
    faqs.push({
      question: `Does ${msp.name} support ${msp.compliance[0]} compliance?`,
      answer: `Yes. ${msp.name} says it helps clients meet ${joinWords(msp.compliance)}.`,
    });
  }
  if (msp.industries.length) {
    faqs.push({
      question: `Which industries does ${msp.name} work with?`,
      answer: `${msp.name} names ${joinWords(msp.industries.map((value) => label(INDUSTRY_LABELS, value).toLowerCase()))} among the industries it serves.`,
    });
  }
  const area = msp.serviceArea ? ` It serves ${msp.serviceArea}.` : "";
  faqs.push({
    question: `Where is ${msp.name} located?`,
    answer: msp.addresses.length
      ? `${msp.name} lists ${msp.addresses.length > 1 ? `${msp.addresses.length} offices, including ` : "its office at "}${msp.addresses[0]}.${area}`
      : `${msp.name} doesn't list an office address on its website.${area || ` It's listed in the ${city.name} metro.`}`,
  });
  if (msp.pricing) {
    faqs.push({
      question: `How does ${msp.name} price its services?`,
      answer: `According to its website: ${msp.pricing.replace(/\.?$/, ".")} Ask the company for a quote based on your number of users and devices.`,
    });
  }
  faqs.push({
    question: `How does ${msp.name} rank among MSPs in ${city.name}?`,
    answer: `${msp.name} ranks #${rank} of ${city.count} MSPs in the ${city.name} metro, with an MSP Hub Score of ${msp.score.total}/100. The score reflects what the company documents publicly: years in business, managed services coverage, compliance support, industries served and pricing transparency. Its live Google rating is shown at the top of this page.`,
  });
  return faqs;
}
