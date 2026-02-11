import { NextRequest, NextResponse } from "next/server";
import { ENGAGEMENTS_LIMIT } from "@/lib/engagement-config";
import {
  getCachedEngagements,
  setCachedEngagements,
  engagementCacheKey,
} from "@/lib/engagement-cache";
import { fetchEngagementsForContact } from "@/lib/hubspot-engagements";
import { generateEngagementSummaries } from "@/lib/engagement-summary";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "HubSpot not configured" },
      { status: 503 }
    );
  }
  const contactId = (await params).id;
  if (!contactId) {
    return NextResponse.json({ error: "Missing contact id" }, { status: 400 });
  }

  const cacheKey = engagementCacheKey("contact", contactId);
  const cached = getCachedEngagements(cacheKey);
  if (cached) {
    return NextResponse.json({
      engagements: cached.engagements,
      displaySummaries: cached.displaySummaries,
      contextSummary: cached.contextSummary,
    });
  }

  try {
    console.log(`Fetching engagements for contact ${contactId}`);
    const engagements = await fetchEngagementsForContact(
      token,
      contactId,
      ENGAGEMENTS_LIMIT
    );

    console.log(`Found ${engagements.length} engagements for contact ${contactId}`);

    let displaySummaries: string[] = [];
    let contextSummary = "No engagement history.";

    if (engagements.length > 0) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (apiKey) {
        const summaryResult = await generateEngagementSummaries(
          engagements,
          apiKey
        );
        if (summaryResult) {
          displaySummaries = summaryResult.displaySummaries;
          contextSummary = summaryResult.contextSummary;
        }
      }
      if (displaySummaries.length < engagements.length) {
        while (displaySummaries.length < engagements.length) {
          displaySummaries.push("Summary unavailable.");
        }
      }
    }

    const payload = {
      engagements,
      displaySummaries,
      contextSummary,
    };
    setCachedEngagements(cacheKey, payload);
    return NextResponse.json(payload);
  } catch (e) {
    console.error("Contact engagements error:", e);
    const status = e instanceof Error && e.message.includes("429") ? 429 : 500;
    return NextResponse.json(
      { error: "Couldn't load engagement history. Try again." },
      { status }
    );
  }
}
