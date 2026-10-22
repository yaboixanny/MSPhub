export const SERVICE_LABELS: Record<string, string> = {
  managed_it: "Managed IT",
  help_desk: "Help desk",
  cybersecurity: "Cybersecurity",
  cloud_microsoft_365: "Cloud & Microsoft 365",
  backup_disaster_recovery: "Backup & disaster recovery",
  network_infrastructure: "Networking",
  voip_phones: "VoIP & phones",
  co_managed_it: "Co-managed IT",
  it_strategy_vcio: "IT strategy / vCIO",
  compliance_services: "Compliance",
  hardware_procurement: "Hardware procurement",
  structured_cabling: "Structured cabling",
  software_development: "Software development",
  web_design: "Web design",
  computer_repair: "Computer repair",
};

export const INDUSTRY_LABELS: Record<string, string> = {
  healthcare: "Healthcare",
  dental: "Dental",
  legal: "Legal",
  accounting_finance: "Accounting & finance",
  insurance: "Insurance",
  construction: "Construction",
  manufacturing: "Manufacturing",
  engineering_architecture: "Engineering & architecture",
  nonprofit: "Nonprofit",
  education: "Education",
  government: "Government",
  real_estate: "Real estate",
  hospitality: "Hospitality",
  retail: "Retail",
  logistics: "Logistics",
  automotive: "Automotive",
  professional_services: "Professional services",
};

export function label(map: Record<string, string>, value: string) {
  return map[value] ?? value;
}
