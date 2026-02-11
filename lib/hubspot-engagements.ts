import { ENGAGEMENTS_LIMIT } from "./engagement-config";
import type { EngagementItem } from "./engagement-cache";

const HUBSPOT_BASE = "https://api.hubapi.com";

const ENGAGEMENT_TYPES = ["calls", "emails", "meetings", "notes"] as const;
type AssocType = (typeof ENGAGEMENT_TYPES)[number];

async function fetchWithAuth(
  url: string,
  token: string
): Promise<{ ok: boolean; status: number; data?: unknown }> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = undefined;
  }
  return { ok: res.ok, status: res.status, data };
}

function parseTimestamp(ts: string | number | undefined): number {
  if (ts == null) {
    console.warn("Timestamp is null or undefined");
    return Date.now(); // Use current time as fallback instead of 0
  }

  if (typeof ts === "number") {
    return ts;
  }

  // Try parsing as number first (HubSpot timestamps are often string-encoded milliseconds)
  const n = parseInt(ts, 10);
  if (!Number.isNaN(n) && n > 0) {
    return n;
  }

  // Try parsing as ISO date string
  const d = new Date(ts).getTime();
  if (!Number.isNaN(d) && d > 0) {
    return d;
  }

  console.warn(`Failed to parse timestamp: ${ts}, using current time`);
  return Date.now(); // Use current time as fallback instead of epoch
}

function normalizeEngagement(
  type: "call" | "email" | "meeting" | "note",
  id: string,
  props: Record<string, unknown>,
  contactName?: string
): EngagementItem {
  // Each engagement type has a different primary timestamp property
  let rawTimestamp: string | number | undefined;

  switch (type) {
    case "call":
    case "email":
      rawTimestamp = props.hs_timestamp as string | number;
      break;
    case "meeting":
      // Meetings use hs_meeting_start_time, fallback to hs_timestamp
      rawTimestamp = (props.hs_meeting_start_time as string | number) ?? (props.hs_timestamp as string | number);
      break;
    case "note":
      // Notes use hs_created_date or hs_lastmodifieddate
      rawTimestamp = (props.hs_created_date as string | number) ?? (props.hs_lastmodifieddate as string | number) ?? (props.hs_timestamp as string | number);
      break;
  }

  console.log(`Processing ${type} engagement ${id}, raw timestamp:`, rawTimestamp, `type:`, typeof rawTimestamp);
  const timestamp = parseTimestamp(rawTimestamp);
  const dateStr = timestamp ? new Date(timestamp).toISOString() : "";
  console.log(`Parsed timestamp for ${type} ${id}:`, timestamp, `→`, dateStr);

  let title: string | undefined;
  let body: string | undefined;
  let direction: string | undefined;
  let duration: string | undefined;

  switch (type) {
    case "call":
      body = (props.hs_call_body as string) ?? undefined;
      direction = (props.hs_call_direction as string) ?? undefined;
      duration = (props.hs_call_duration as string) ?? undefined;
      title = duration ? `Call (${duration}s)` : "Call";
      break;
    case "email":
      title = (props.hs_email_subject as string) ?? "Email";
      body = (props.hs_email_text as string) ?? (props.hs_email_html as string) ?? undefined;
      direction = (props.hs_email_direction as string) ?? undefined;
      break;
    case "meeting":
      title = (props.hs_meeting_title as string) ?? "Meeting";
      body = (props.hs_meeting_body as string) ?? undefined;
      break;
    case "note":
      title = "Note";
      body = (props.hs_note_body as string) ?? undefined;
      break;
  }

  return {
    id,
    type,
    timestamp: dateStr,
    title,
    body: body?.slice(0, 5000),
    direction,
    duration,
    contactName,
  };
}

async function getAssociationIds(
  token: string,
  contactId: string,
  type: AssocType
): Promise<string[]> {
  // Use v3 API to search for engagements associated with this contact
  const engagementTypeMap: Record<AssocType, string> = {
    calls: "CALL",
    emails: "EMAIL",
    meetings: "MEETING",
    notes: "NOTE",
  };

  const url = `${HUBSPOT_BASE}/crm/v3/objects/${type}/search`;
  const body = {
    filterGroups: [
      {
        filters: [
          {
            propertyName: "associations.contact",
            operator: "EQ",
            value: contactId,
          },
        ],
      },
    ],
    properties: ["hs_timestamp"],
    limit: 100,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let errorMsg = `Failed to fetch ${type} associations for contact ${contactId}: ${res.status} ${res.statusText}`;

    try {
      const errorData = await res.json();
      if (errorData && typeof errorData === "object") {
        const err = errorData as { message?: string; category?: string };
        if (err.category === "MISSING_SCOPES") {
          console.warn(`⚠️ Missing HubSpot scope for ${type} - skipping this engagement type. Message: ${err.message}`);
          return []; // Silently skip this type if scope is missing
        }
        errorMsg += ` - ${err.message}`;
      }
    } catch {
      // Couldn't parse error response
    }

    console.error(errorMsg);
    return [];
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch (e) {
    console.error(`Failed to parse JSON response for ${type} associations:`, e);
    return [];
  }

  if (!data || typeof data !== "object") return [];
  const results = (data as { results?: Array<{ id?: string }> }).results ?? [];
  const ids = results.map((r) => r.id).filter((id): id is string => typeof id === "string");

  if (ids.length > 0) {
    console.log(`✓ Found ${ids.length} ${type} for contact ${contactId}`);
  }

  return ids;
}

async function getEngagementDetails(
  token: string,
  type: AssocType,
  id: string
): Promise<EngagementItem | null> {
  const objectType = type === "calls" ? "calls" : type === "emails" ? "emails" : type === "meetings" ? "meetings" : "notes";
  const propsMap: Record<AssocType, string> = {
    calls: "hs_timestamp,hs_call_body,hs_call_direction,hs_call_duration",
    emails: "hs_timestamp,hs_email_direction,hs_email_subject,hs_email_text,hs_email_html",
    meetings: "hs_timestamp,hs_meeting_start_time,hs_meeting_end_time,hs_meeting_title,hs_meeting_body",
    notes: "hs_timestamp,hs_created_date,hs_lastmodifieddate,hs_note_body",
  };
  const url = `${HUBSPOT_BASE}/crm/v3/objects/${objectType}/${id}?properties=${propsMap[type]}`;
  const { ok, status, data } = await fetchWithAuth(url, token);

  if (!ok) {
    console.error(`Failed to fetch ${type} details for ID ${id}: ${status}`);
    return null;
  }

  if (!data || typeof data !== "object") {
    console.error(`Invalid data response for ${type} ID ${id}`);
    return null;
  }

  const props = (data as { properties?: Record<string, unknown> }).properties ?? {};
  const engagementType = type.slice(0, -1) as "call" | "email" | "meeting" | "note";
  return normalizeEngagement(engagementType, id, props);
}

/** Fetch last N engagements for a contact (calls, emails, meetings, notes). */
export async function fetchEngagementsForContact(
  token: string,
  contactId: string,
  limit: number = ENGAGEMENTS_LIMIT
): Promise<EngagementItem[]> {
  const all: EngagementItem[] = [];

  for (const assocType of ENGAGEMENT_TYPES) {
    const ids = await getAssociationIds(token, contactId, assocType);
    for (const id of ids) {
      const item = await getEngagementDetails(token, assocType, id);
      if (item) all.push(item);
    }
  }

  all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return all.slice(0, limit);
}

/** Max contacts to consider when aggregating company engagements (avoids rate limits). */
const COMPANY_ENGAGEMENT_CONTACTS_LIMIT = 10;

/** Fetch last N engagements across all contacts at a company. */
export async function fetchEngagementsForCompany(
  token: string,
  companyId: string,
  limit: number = ENGAGEMENTS_LIMIT
): Promise<EngagementItem[]> {
  const assocUrl = `${HUBSPOT_BASE}/crm/v4/objects/companies/${companyId}/associations/contacts`;
  const { ok, data } = await fetchWithAuth(assocUrl, token);
  if (!ok || !data || typeof data !== "object") return [];

  const results = (data as { results?: Array<{ toObjectId?: string }> }).results ?? [];
  const contactIds = results
    .map((r) => r.toObjectId)
    .filter((id): id is string => typeof id === "string")
    .slice(0, COMPANY_ENGAGEMENT_CONTACTS_LIMIT);

  const contactNames = new Map<string, string>();
  for (const cid of contactIds) {
    const cr = await fetchWithAuth(
      `${HUBSPOT_BASE}/crm/v3/objects/contacts/${cid}?properties=firstname,lastname`,
      token
    );
    if (cr.ok && cr.data && typeof cr.data === "object") {
      const p = (cr.data as { properties?: { firstname?: string; lastname?: string } }).properties ?? {};
      const name = [p.firstname, p.lastname].filter(Boolean).join(" ").trim() || "—";
      contactNames.set(cid, name);
    }
  }

  const all: EngagementItem[] = [];
  for (const cid of contactIds) {
    const items = await fetchEngagementsForContact(token, cid, limit * 2);
    const name = contactNames.get(cid);
    for (const item of items) {
      all.push({ ...item, contactName: name || item.contactName });
    }
  }

  all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return all.slice(0, limit);
}
