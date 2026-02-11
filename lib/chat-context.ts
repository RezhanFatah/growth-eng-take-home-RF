/** Build a plain-text context string for the AI from directory entry and/or HubSpot data */
export function buildContextFromDirectory(entry: {
  companyName: string;
  companyDomain?: string;
  personName?: string;
  personTitle?: string;
  location?: string;
  score?: number;
  tier?: string;
  fitReasons?: string;
  raw: Record<string, string>;
}): string {
  const lines: string[] = [
    `Company: ${entry.companyName}`,
    entry.companyDomain ? `Domain: ${entry.companyDomain}` : "",
    entry.personName ? `Contact: ${entry.personName}` : "",
    entry.personTitle ? `Title: ${entry.personTitle}` : "",
    entry.location ? `Location: ${entry.location}` : "",
    entry.score != null ? `Fit score: ${entry.score}` : "",
    entry.tier ? `Tier: ${entry.tier}` : "",
    entry.fitReasons ? `Fit reasons: ${entry.fitReasons}` : "",
  ].filter(Boolean);
  const raw = Object.entries(entry.raw)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return lines.join("\n") + (raw ? "\n\nOther fields:\n" + raw : "");
}

export function buildContextFromHubSpotCompany(company: {
  properties: Record<string, string>;
}, contacts: Array<{ firstname?: string; lastname?: string; jobtitle?: string; email?: string }>): string {
  const lines: string[] = [
    "HubSpot company:",
    `Name: ${company.properties.name ?? "—"}`,
    `Domain: ${company.properties.domain ?? "—"}`,
    `Website: ${company.properties.website ?? "—"}`,
    `Industry: ${company.properties.industry ?? "—"}`,
    `Revenue: ${company.properties.annualrevenue ?? "—"}`,
    `Lifecycle: ${company.properties.lifecyclestage ?? "—"}`,
  ];
  if (contacts.length > 0) {
    lines.push("\nContacts:");
    contacts.forEach((c) => {
      lines.push(`- ${[c.firstname, c.lastname].filter(Boolean).join(" ")} ${c.jobtitle ? `(${c.jobtitle})` : ""}`);
    });
  }
  return lines.join("\n");
}

export function buildContextFromHubSpotContact(contact: {
  properties: Record<string, string>;
}): string {
  const p = contact.properties;
  return [
    "HubSpot contact:",
    `Name: ${[p.firstname, p.lastname].filter(Boolean).join(" ")}`,
    `Email: ${p.email ?? "—"}`,
    `Phone: ${p.phone ?? "—"}`,
    `Title: ${p.jobtitle ?? "—"}`,
    `Company: ${p.company ?? "—"}`,
  ].join("\n");
}

export function buildContextFromEngagements(contextSummary: string): string {
  if (!contextSummary?.trim()) return "";
  return "\n\nEngagement history (summary):\n" + contextSummary.trim();
}
