import { NextRequest, NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity";
import { conventionsQuery } from "@/lib/sanity";
import {
  parseCsvToEntries,
  buildDirectoryIndex,
  searchDirectory,
  groupBySource,
  type DirectoryEntry,
} from "@/lib/directory";

const HUBSPOT_BASE = "https://api.hubapi.com";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const conventionSlug = req.nextUrl.searchParams.get("convention")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing q" }, { status: 400 });
  }

  const token = process.env.HUBSPOT_ACCESS_TOKEN;

  try {
    const conventions = sanityClient
      ? await sanityClient.fetch<Array<{ slug: string; targetListUrl?: string; attendeeListUrl?: string }>>(conventionsQuery)
      : [];
    const convention = conventionSlug
      ? conventions.find((c) => c.slug === conventionSlug)
      : conventions[0];

    let directoryEntries: DirectoryEntry[] = [];
    if (convention?.targetListUrl || convention?.attendeeListUrl) {
      const [targetEntries, attendeeEntries] = await Promise.all([
        convention.targetListUrl
          ? fetch(convention.targetListUrl).then((r) => r.text()).then((t) => parseCsvToEntries(t, "target"))
          : Promise.resolve([]),
        convention.attendeeListUrl
          ? fetch(convention.attendeeListUrl).then((r) => r.text()).then((t) => parseCsvToEntries(t, "attendee"))
          : Promise.resolve([]),
      ]);
      const all = buildDirectoryIndex(targetEntries, attendeeEntries);
      directoryEntries = searchDirectory(all, q);
    }

    let companies: Array<{ id: string; type: "company"; name: string; subtitle: string }> = [];
    let contacts: Array<{ id: string; type: "contact"; name: string; subtitle: string }> = [];

    if (token) {
      const [companyRes, contactRes] = await Promise.all([
        fetch(`${HUBSPOT_BASE}/crm/v3/objects/companies/search`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filterGroups: [
              { filters: [{ propertyName: "name", operator: "CONTAINS_TOKEN", value: `*${q}*` }] },
            ],
            properties: ["name", "domain", "industry"],
            limit: 10,
          }),
        }).then((r) => r.json()),
        fetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts/search`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filterGroups: [
              { filters: [{ propertyName: "firstname", operator: "CONTAINS_TOKEN", value: `*${q}*` }] },
              { filters: [{ propertyName: "lastname", operator: "CONTAINS_TOKEN", value: `*${q}*` }] },
            ],
            properties: ["firstname", "lastname", "jobtitle", "company"],
            limit: 10,
          }),
        }).then((r) => r.json()),
      ]);

      if (companyRes.results) {
        companies = companyRes.results.map((c: { id: string; properties: Record<string, string> }) => ({
          id: c.id,
          type: "company" as const,
          name: c.properties.name ?? "—",
          subtitle: c.properties.domain ?? c.properties.industry ?? "",
        }));
      }
      if (contactRes.results) {
        contacts = contactRes.results.map((c: { id: string; properties: Record<string, string> }) => ({
          id: c.id,
          type: "contact" as const,
          name: [c.properties.firstname, c.properties.lastname].filter(Boolean).join(" "),
          subtitle: [c.properties.jobtitle, c.properties.company].filter(Boolean).join(" · "),
        }));
      }
    }

    const directoryResults = directoryEntries.slice(0, 15).map((e) => ({
      id: e.id,
      type: "directory" as const,
      source: e.source,
      name: e.personName || e.companyName,
      subtitle: [e.personTitle, e.companyName].filter(Boolean).join(" · "),
      conventionSlug: convention?.slug,
      entry: e,
    }));

    return NextResponse.json({
      companies,
      contacts,
      directory: directoryResults,
      conventionSlug: convention?.slug ?? null,
    });
  } catch (e) {
    console.error("Chat search error:", e);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
