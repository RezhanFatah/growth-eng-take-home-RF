import { NextRequest, NextResponse } from "next/server";

const HUBSPOT_BASE = "https://api.hubapi.com";

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
  const companyId = (await params).id;
  if (!companyId) {
    return NextResponse.json({ error: "Missing company id" }, { status: 400 });
  }
  try {
    const [companyRes, assocRes] = await Promise.all([
      fetch(
        `${HUBSPOT_BASE}/crm/v3/objects/companies/${companyId}?properties=name,domain,website,industry,annualrevenue,lifecyclestage`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
      fetch(
        `${HUBSPOT_BASE}/crm/v4/objects/companies/${companyId}/associations/contacts`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
    ]);
    if (!companyRes.ok) {
      if (companyRes.status === 404) {
        return NextResponse.json({ error: "Company not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Failed to fetch company" },
        { status: companyRes.status }
      );
    }
    const company = await companyRes.json();
    const contactIds: string[] = [];
    if (assocRes.ok) {
      const assoc = await assocRes.json();
      contactIds.push(...(assoc.results ?? []).map((r: { toObjectId: string }) => r.toObjectId));
    }
    const contacts: Array<{
      id: string;
      firstname?: string;
      lastname?: string;
      email?: string;
      jobtitle?: string;
      phone?: string;
    }> = [];
    for (const cid of contactIds.slice(0, 20)) {
      const cr = await fetch(
        `${HUBSPOT_BASE}/crm/v3/objects/contacts/${cid}?properties=firstname,lastname,email,jobtitle,phone`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (cr.ok) {
        const c = await cr.json();
        contacts.push({
          id: c.id,
          ...c.properties,
        });
      }
    }
    return NextResponse.json({
      company,
      contacts,
    });
  } catch (e) {
    console.error("HubSpot company detail error:", e);
    return NextResponse.json(
      { error: "Failed to load company" },
      { status: 500 }
    );
  }
}
