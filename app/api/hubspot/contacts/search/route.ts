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
    const q = (body.q as string)?.trim();
    if (!q) {
      return NextResponse.json(
        { error: "Provide q" },
        { status: 400 }
      );
    }
    const value = `*${q}*`;
    const res = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filterGroups: [
          { filters: [{ propertyName: "firstname", operator: "CONTAINS_TOKEN", value }] },
          { filters: [{ propertyName: "lastname", operator: "CONTAINS_TOKEN", value }] },
        ],
        properties: ["firstname", "lastname", "email", "jobtitle", "phone", "company"],
        limit: 20,
        sorts: [{ propertyName: "lastname", direction: "ASCENDING" }],
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
    console.error("HubSpot contacts search error:", e);
    return NextResponse.json(
      { error: "Search unavailable" },
      { status: 500 }
    );
  }
}
