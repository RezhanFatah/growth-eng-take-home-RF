import { NextRequest, NextResponse } from "next/server";

const HUBSPOT_BASE = "https://api.hubapi.com";

export async function GET(
  req: NextRequest,
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

  // Check if associations are requested
  const searchParams = req.nextUrl.searchParams;
  const includeAssociations = searchParams.get("associations");

  try {
    const res = await fetch(
      `${HUBSPOT_BASE}/crm/v3/objects/contacts/${contactId}?properties=firstname,lastname,email,jobtitle,phone,company`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.status === 404) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch contact" },
        { status: res.status }
      );
    }
    const data = await res.json();

    // Fetch company associations if requested
    if (includeAssociations === "companies") {
      try {
        const assocRes = await fetch(
          `${HUBSPOT_BASE}/crm/v4/objects/contacts/${contactId}/associations/companies`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (assocRes.ok) {
          const assocData = await assocRes.json();
          data.associations = {
            companies: assocData,
          };
        }
      } catch (e) {
        console.error("Failed to fetch company associations:", e);
        // Continue without associations
      }
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("HubSpot contact detail error:", e);
    return NextResponse.json(
      { error: "Failed to load contact" },
      { status: 500 }
    );
  }
}
