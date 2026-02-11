import { parseCsv, normalizeSearch, domainFromUrl } from "./csv";

export type SourceType = "target" | "attendee";

/** Normalized row for directory: can be company-level (target) or person-level (attendee) */
export type DirectoryEntry = {
  id: string;
  source: SourceType;
  companyName: string;
  companyDomain: string;
  personName?: string;
  personTitle?: string;
  location?: string;
  score?: number;
  tier?: string;
  fitReasons?: string;
  /** Numeric revenue for sorting (parsed from Revenue column) */
  revenueNum?: number;
  raw: Record<string, string>;
};

function parseRevenue(value: string | undefined): number | undefined {
  if (!value || typeof value !== "string") return undefined;
  const cleaned = value.replace(/[$,\s]/g, "");
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? undefined : num;
}

/** WoC-style: Company, Website, Platform, Revenue, Industry, Score, Tier, Fit Reasons, Concerns */
function parseTargetList(csvRows: Record<string, string>[]): DirectoryEntry[] {
  return csvRows.map((row, i) => {
    const company = row["Company"] ?? row["Company Name"] ?? "";
    const website = row["Website"] ?? row["Company URL"] ?? "";
    return {
      id: `target-${i}-${company}`,
      source: "target",
      companyName: company,
      companyDomain: domainFromUrl(website),
      location: row["Company City"] || row["Location"] || undefined,
      score: row["Score"] ? parseInt(row["Score"], 10) : undefined,
      tier: row["Tier"],
      fitReasons: row["Fit Reasons"],
      revenueNum: parseRevenue(row["Revenue"]),
      raw: row,
    };
  });
}

/** Shoptalk-style: First Name, Last Name, Job Title, Company, Company URL, ... */
function parseAttendeeList(csvRows: Record<string, string>[]): DirectoryEntry[] {
  return csvRows.map((row, i) => {
    const first = row["First Name"] ?? "";
    const last = row["Last Name"] ?? "";
    const company = row["Company"] ?? row["Company Name"] ?? row["Organization"] ?? "";
    const url = row["Company URL"] ?? row["Website"] ?? "";
    return {
      id: `attendee-${i}-${first}-${last}-${company}`,
      source: "attendee",
      companyName: company,
      companyDomain: domainFromUrl(url),
      personName: [first, last].filter(Boolean).join(" ").trim() || undefined,
      personTitle: row["Job Title"] ?? row["Title"] ?? undefined,
      location: row["Country"] ?? row["Regions"] ?? undefined,
      revenueNum: parseRevenue(row["Revenue"]),
      raw: row,
    };
  });
}

/** Detect CSV shape by headers and parse into DirectoryEntry[] */
export function parseCsvToEntries(
  csvText: string,
  source: SourceType
): DirectoryEntry[] {
  const rows = parseCsv(csvText);
  if (rows.length === 0) return [];
  const headers = Object.keys(rows[0]).map((h) => h.toLowerCase());
  const hasPerson = headers.some(
    (h) =>
      h.includes("first name") ||
      h.includes("last name") ||
      h.includes("job title")
  );
  const hasScore = headers.some((h) => h === "score" || h.includes("tier"));
  if (source === "target" || (source === "attendee" && hasScore && !hasPerson))
    return parseTargetList(rows);
  return parseAttendeeList(rows);
}

/** Build merged directory index and search helper */
export function buildDirectoryIndex(
  targetEntries: DirectoryEntry[],
  attendeeEntries: DirectoryEntry[]
): DirectoryEntry[] {
  const combined = [
    ...targetEntries.map((e) => ({ ...e, source: "target" as SourceType })),
    ...attendeeEntries.map((e) => ({ ...e, source: "attendee" as SourceType })),
  ];
  return combined;
}

/** Search directory by query (company name, person name, location) */
export function searchDirectory(
  entries: DirectoryEntry[],
  query: string
): DirectoryEntry[] {
  const nq = normalizeSearch(query);
  if (!nq) return entries;
  return entries.filter((e) => {
    const company = normalizeSearch(e.companyName);
    const person = normalizeSearch(e.personName ?? "");
    const title = normalizeSearch(e.personTitle ?? "");
    const location = normalizeSearch(e.location ?? "");
    return (
      company.includes(nq) ||
      person.includes(nq) ||
      title.includes(nq) ||
      location.includes(nq)
    );
  });
}

/** Group entries into exhibitors (target) and attendees (attendee) */
export function groupBySource(entries: DirectoryEntry[]) {
  const exhibitors = entries.filter((e) => e.source === "target");
  const attendees = entries.filter((e) => e.source === "attendee");
  return { exhibitors, attendees };
}
