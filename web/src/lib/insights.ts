/**
 * Original comparisons computed from MSP Hub's own data: how a metro differs from the
 * rest of the directory, and how a profile compares with its metro. Nothing here comes
 * from a company's website text, so it isn't a copy of what they publish. Small metros
 * get nothing rather than noisy numbers.
 */
import type { Msp } from "@/lib/data";
import { INDUSTRY_LABELS, label } from "@/lib/labels";
import { CORE_SERVICES } from "@/lib/score";

// Fewer MSPs than this and a percentage says little.
const MIN_PEERS = 10;
const MIN_DIFFERENCE = 0.12;

const percent = (share: number) => `${Math.round(share * 100)}%`;
const share = (items: Msp[], test: (msp: Msp) => boolean) => (items.length ? items.filter(test).length / items.length : 0);
const coreCount = (msp: Msp) => msp.services.filter((service) => CORE_SERVICES.includes(service)).length;

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
}

/** Where a metro differs most from the whole directory, as plain sentences (up to three). */
export function metroDifferences(place: string, msps: Msp[], all: Msp[]): string[] {
  if (msps.length < MIN_PEERS) return [];
  const checks: { name: string; test: (msp: Msp) => boolean; phrase: (label: string) => string }[] = [
    { name: "pricing", test: (msp) => Boolean(msp.pricing), phrase: () => "describe their pricing publicly" },
    { name: "core", test: (msp) => coreCount(msp) >= 7, phrase: () => "offer at least 7 of the 8 core managed services" },
  ];
  for (const framework of new Set(all.flatMap((msp) => msp.compliance))) {
    if (all.filter((msp) => msp.compliance.includes(framework)).length < 15) continue;
    checks.push({ name: framework, test: (msp) => msp.compliance.includes(framework), phrase: () => `list ${framework} support` });
  }
  for (const industry of new Set(all.flatMap((msp) => msp.industries))) {
    if (all.filter((msp) => msp.industries.includes(industry)).length < 15) continue;
    const name = label(INDUSTRY_LABELS, industry).toLowerCase();
    checks.push({ name: industry, test: (msp) => msp.industries.includes(industry), phrase: () => `name ${name} as an industry they serve` });
  }
  return checks
    .map((check) => ({ check, here: share(msps, check.test), everywhere: share(all, check.test) }))
    .filter(({ here, everywhere }) => Math.abs(here - everywhere) >= MIN_DIFFERENCE)
    .sort((a, b) => Math.abs(b.here - b.everywhere) - Math.abs(a.here - a.everywhere))
    .slice(0, 3)
    .map(({ check, here, everywhere }) =>
      `${percent(here)} of MSPs in ${place} ${check.phrase("")}, ${here > everywhere ? "above" : "below"} the ${percent(everywhere)} across all ${all.length} MSPs on MSP Hub.`);
}

/** How one MSP compares with the other MSPs in its metro (up to four sentences). */
export function profileInsights(msp: Msp, peers: Msp[], placeName: string, asOfYear: number): string[] {
  if (peers.length < MIN_PEERS) return [];
  const lines: string[] = [];

  const founded = peers.filter((peer) => peer.foundedYear).map((peer) => peer.foundedYear!);
  if (msp.foundedYear && founded.length >= MIN_PEERS) {
    const younger = founded.filter((year) => year > msp.foundedYear!).length;
    const medianYear = median(founded)!;
    lines.push(
      `Founded in ${msp.foundedYear} (${asOfYear - msp.foundedYear} years in business), it is older than ${younger} of the ${founded.length} ${placeName} MSPs that state a founding year; the typical one was founded in ${medianYear}.`);
  }

  const rare: string[] = [];
  for (const framework of msp.compliance) {
    const count = peers.filter((peer) => peer.compliance.includes(framework)).length;
    if (count / peers.length <= 0.25) rare.push(`${framework} (${count} of ${peers.length})`);
  }
  for (const industry of msp.industries) {
    const count = peers.filter((peer) => peer.industries.includes(industry)).length;
    if (count / peers.length <= 0.2) rare.push(`${label(INDUSTRY_LABELS, industry).toLowerCase()} clients (${count} of ${peers.length})`);
  }
  if (rare.length) {
    lines.push(`Less common among ${placeName} MSPs, it lists ${rare.slice(0, 3).join(", ")}.`);
  }

  const medianCore = median(peers.map(coreCount))!;
  const core = coreCount(msp);
  if (core !== medianCore) {
    lines.push(`It lists ${core} of 8 core managed services; the typical ${placeName} MSP lists ${medianCore}.`);
  }

  const priced = peers.filter((peer) => peer.pricing).length;
  if (msp.pricing && priced / peers.length <= 0.5) {
    lines.push(`It is one of ${priced} of ${peers.length} ${placeName} MSPs that describe their pricing publicly.`);
  }
  return lines.slice(0, 4);
}
