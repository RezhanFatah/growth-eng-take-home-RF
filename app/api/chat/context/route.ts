import { NextRequest, NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity";
import { conventionBySlugQuery } from "@/lib/sanity";
import { parseCsvToEntries, buildDirectoryIndex } from "@/lib/directory";
import {
  buildContextFromDirectory,
  buildContextFromHubSpotCompany,
  buildContextFromHubSpotContact,
  buildContextFromEngagements,
} from "@/lib/chat-context";
import {
  getCachedEngagements,
  setCachedEngagements,
  engagementCacheKey,
} from "@/lib/engagement-cache";
import { ENGAGEMENTS_LIMIT } from "@/lib/engagement-config";
import { fetchEngagementsForContact, fetchEngagementsForCompany } from "@/lib/hubspot-engagements";
import { generateEngagementSummaries } from "@/lib/engagement-summary";

const HUBSPOT_BASE = "https://api.hubapi.com";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const id = req.nextUrl.searchParams.get("id");
  const slug = req.nextUrl.searchParams.get("slug");
  if (!type || !id) {
    return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
  }
  const token = process.env.HUBSPOT_ACCESS_TOKEN;

  try {
    if (type === "company") {
      if (!token) return NextResponse.json({ error: "HubSpot not configured" }, { status: 503 });
      const [companyRes, assocRes] = await Promise.all([
        fetch(
          `${HUBSPOT_BASE}/crm/v3/objects/companies/${id}?properties=name,domain,website,industry,annualrevenue,lifecyclestage`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        fetch(
          `${HUBSPOT_BASE}/crm/v4/objects/companies/${id}/associations/contacts`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);
      if (!companyRes.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const company = await companyRes.json();
      const contactIds: string[] = assocRes.ok
        ? (await assocRes.json()).results?.map((r: { toObjectId: string }) => r.toObjectId) ?? []
        : [];
      const contacts: Array<{ firstname?: string; lastname?: string; jobtitle?: string }> = [];
      for (const cid of contactIds.slice(0, 10)) {
        const cr = await fetch(
          `${HUBSPOT_BASE}/crm/v3/objects/contacts/${cid}?properties=firstname,lastname,jobtitle`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (cr.ok) contacts.push((await cr.json()).properties ?? {});
      }
      const name = company.properties?.name ?? "Company";
      let context = buildContextFromHubSpotCompany(company, contacts);
      const companyCacheKey = engagementCacheKey("company", id);
      let companyCached = getCachedEngagements(companyCacheKey);
      if (!companyCached) {
        try {
          const engagements = await fetchEngagementsForCompany(token, id, ENGAGEMENTS_LIMIT);
          if (engagements.length > 0 && process.env.ANTHROPIC_API_KEY) {
            const summaryResult = await generateEngagementSummaries(
              engagements,
              process.env.ANTHROPIC_API_KEY
            );
            if (summaryResult) {
              companyCached = {
                engagements,
                displaySummaries: summaryResult.displaySummaries,
                contextSummary: summaryResult.contextSummary,
                fetchedAt: Date.now(),
              };
              setCachedEngagements(companyCacheKey, {
                engagements,
                displaySummaries: summaryResult.displaySummaries,
                contextSummary: summaryResult.contextSummary,
              });
            }
          }
        } catch {
          // non-blocking: continue without engagement context
        }
      }
      if (companyCached?.contextSummary) {
        context += buildContextFromEngagements(companyCached.contextSummary);
      }
      return NextResponse.json({ name, context });
    }

    if (type === "contact") {
      if (!token) return NextResponse.json({ error: "HubSpot not configured" }, { status: 503 });
      const res = await fetch(
        `${HUBSPOT_BASE}/crm/v3/objects/contacts/${id}?properties=firstname,lastname,email,jobtitle,phone,company`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const contact = await res.json();
      const name = [contact.properties?.firstname, contact.properties?.lastname].filter(Boolean).join(" ") || "Contact";
      let context = buildContextFromHubSpotContact(contact);
      const contactCacheKey = engagementCacheKey("contact", id);
      let contactCached = getCachedEngagements(contactCacheKey);
      if (!contactCached) {
        try {
          const engagements = await fetchEngagementsForContact(token, id, ENGAGEMENTS_LIMIT);
          if (engagements.length > 0 && process.env.ANTHROPIC_API_KEY) {
            const summaryResult = await generateEngagementSummaries(
              engagements,
              process.env.ANTHROPIC_API_KEY
            );
            if (summaryResult) {
              contactCached = {
                engagements,
                displaySummaries: summaryResult.displaySummaries,
                contextSummary: summaryResult.contextSummary,
                fetchedAt: Date.now(),
              };
              setCachedEngagements(contactCacheKey, {
                engagements,
                displaySummaries: summaryResult.displaySummaries,
                contextSummary: summaryResult.contextSummary,
              });
            }
          }
        } catch {
          // non-blocking: continue without engagement context
        }
      }
      if (contactCached?.contextSummary) {
        context += buildContextFromEngagements(contactCached.contextSummary);
      }
      return NextResponse.json({ name, context });
    }

    if (type === "directory" && slug) {
      if (!sanityClient) return NextResponse.json({ error: "Sanity not configured" }, { status: 503 });
      const convention = await sanityClient.fetch(conventionBySlugQuery, { slug });
      if (!convention?.targetListUrl && !convention?.attendeeListUrl) {
        return NextResponse.json({ error: "Convention not found" }, { status: 404 });
      }
      const [targetEntries, attendeeEntries] = await Promise.all([
        convention.targetListUrl
          ? fetch(convention.targetListUrl).then((r) => r.text()).then((t) => parseCsvToEntries(t, "target"))
          : Promise.resolve([]),
        convention.attendeeListUrl
          ? fetch(convention.attendeeListUrl).then((r) => r.text()).then((t) => parseCsvToEntries(t, "attendee"))
          : Promise.resolve([]),
      ]);
      const all = buildDirectoryIndex(targetEntries, attendeeEntries);
      const entry = all.find((e) => e.id === decodeURIComponent(id));
      if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
      const name = entry.personName || entry.companyName;
      const context = buildContextFromDirectory(entry);
      return NextResponse.json({ name, context });
    }

    return NextResponse.json({ error: "Invalid type or missing slug" }, { status: 400 });
  } catch (e) {
    console.error("Chat context error:", e);
    return NextResponse.json({ error: "Failed to load context" }, { status: 500 });
  }
}
