import { NextRequest, NextResponse } from "next/server";

const HUBSPOT_BASE = "https://api.hubapi.com";

export async function POST(req: NextRequest) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "HubSpot not configured" },
      { status: 503 }
    );
  }
  try {
    const body = await req.json();
    const { q, domain } = body as { q?: string; domain?: string };
    const filters: { propertyName: string; operator: string; value: string }[] = [];
    if (domain) {
      const d = String(domain).trim().toLowerCase().replace(/^www\./, "");
      filters.push({ propertyName: "domain", operator: "EQ", value: d });
    } else if (q && q.trim()) {
      const v = `*${String(q).trim()}*`;
      filters.push({ propertyName: "name", operator: "CONTAINS_TOKEN", value: v });
    } else {
      return NextResponse.json(
        { error: "Provide q or domain" },
        { status: 400 }
      );
    }
    const res = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/companies/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filterGroups: [{ filters }],
        properties: [
          "name",
          "domain",
          "website",
          "industry",
          "annualrevenue",
          "lifecyclestage",
        ],
        limit: domain ? 1 : 20,
        sorts: [{ propertyName: "name", direction: "ASCENDING" }],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      if (res.status === 429) {
        return NextResponse.json(
          { error: "Too many requests", retryAfter: res.headers.get("Retry-After") },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "HubSpot search failed", details: err },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("HubSpot companies search error:", e);
    return NextResponse.json(
      { error: "Search unavailable" },
      { status: 500 }
    );
  }
}
