/**
 * The MSP Hub Score: 0-100, built only from what each provider documents on its
 * own website. It measures how much a provider shows about its experience,
 * services, compliance support and pricing, not service quality; profile pages
 * show live Google reviews for that.
 */

export type ScoreInput = {
  foundedYear: number | null;
  services: string[];
  compliance: string[];
  industries: string[];
  partners: string[];
  pricing: string | null;
  teamSize: string | null;
  addresses: string[];
};

export const CORE_SERVICES = [
  "managed_it", "help_desk", "cybersecurity", "backup_disaster_recovery",
  "cloud_microsoft_365", "network_infrastructure", "it_strategy_vcio", "co_managed_it",
];

export const SCORE_PARTS = [
  {
    key: "experience",
    label: "Years in business",
    max: 30,
    explain: "Full points at 20 or more years, based on the founding year the company states.",
  },
  {
    key: "services",
    label: "Managed services coverage",
    max: 25,
    explain:
      "How many of 8 core managed IT services they offer: managed IT, help desk, cybersecurity, backup and disaster recovery, cloud and Microsoft 365, networking, IT strategy (vCIO) and co-managed IT.",
  },
  {
    key: "compliance",
    label: "Compliance support",
    max: 20,
    explain: "Full points for supporting 4 or more frameworks such as HIPAA, CMMC, NIST, SOC 2 or PCI DSS.",
  },
  {
    key: "industries",
    label: "Industry experience",
    max: 10,
    explain: "Full points for naming 5 or more industries they serve.",
  },
  {
    key: "transparency",
    label: "Transparency",
    max: 15,
    explain: "Publishing pricing (7), naming vendor partners or certifications (4), stating team size (2) and listing an office address (2).",
  },
] as const;

export type ScoreKey = (typeof SCORE_PARTS)[number]["key"];
export type Score = { total: number; parts: Record<ScoreKey, number> };

export function scoreMsp(msp: ScoreInput, asOfYear: number): Score {
  const years = msp.foundedYear ? Math.max(0, asOfYear - msp.foundedYear) : 0;
  const core = msp.services.filter((service) => CORE_SERVICES.includes(service)).length;
  const parts: Record<ScoreKey, number> = {
    experience: (Math.min(years, 20) / 20) * 30,
    services: (core / CORE_SERVICES.length) * 25,
    compliance: (Math.min(msp.compliance.length, 4) / 4) * 20,
    industries: (Math.min(msp.industries.length, 5) / 5) * 10,
    transparency:
      (msp.pricing ? 7 : 0) + (msp.partners.length ? 4 : 0) + (msp.teamSize ? 2 : 0) + (msp.addresses.length ? 2 : 0),
  };
  const rounded = Object.fromEntries(
    Object.entries(parts).map(([key, value]) => [key, Math.round(value)]),
  ) as Record<ScoreKey, number>;
  return { total: Math.round(Object.values(parts).reduce((sum, value) => sum + value, 0)), parts: rounded };
}
