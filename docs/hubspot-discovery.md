# HubSpot API Discovery Document

**Date:** 2026-02-10
**Purpose:** Understand HubSpot CRM API structure for company/contact lookup and engagement tracking

---

## API Configuration

- **Base URL:** `https://api.hubapi.com`
- **Authentication:** Bearer token in `Authorization` header
- **Token placeholder:** `HUBSPOT_ACCESS_TOKEN` (to be provided)

---

## Step 0.1 — Company & Contact Properties

### Company Properties API
**Endpoint:** `GET https://api.hubapi.com/crm/v3/properties/companies`

**Request:**
```bash
curl -X GET "https://api.hubapi.com/crm/v3/properties/companies" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:** (pending test call)

### Contact Properties API
**Endpoint:** `GET https://api.hubapi.com/crm/v3/properties/contacts`

**Request:**
```bash
curl -X GET "https://api.hubapi.com/crm/v3/properties/contacts" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:** (pending test call)

### Property Mapping Tables

#### Company Properties (to be populated)
| Internal Name | Label | Type | Notes |
|--------------|-------|------|-------|
| domain | Domain | string | Primary search key |
| name | Company Name | string | |
| website | Website | string | |
| annualrevenue | Annual Revenue | number | |
| industry | Industry | string | |
| lifecyclestage | Lifecycle Stage | enum | |

#### Contact Properties (to be populated)
| Internal Name | Label | Type | Notes |
|--------------|-------|------|-------|
| firstname | First Name | string | |
| lastname | Last Name | string | |
| email | Email | string | |
| phone | Phone | string | |
| jobtitle | Job Title | string | |

---

## Step 0.2 — Company Search by Domain

### Search Companies Endpoint
**Endpoint:** `POST https://api.hubapi.com/crm/v3/objects/companies/search`

**Request:**
```bash
curl -X POST "https://api.hubapi.com/crm/v3/objects/companies/search" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "filterGroups": [{
      "filters": [{
        "propertyName": "domain",
        "operator": "EQ",
        "value": "dripdrop.com"
      }]
    }],
    "properties": ["name", "domain", "website", "industry", "annualrevenue", "lifecyclestage"]
  }'
```

**Test Domain:** `dripdrop.com` (from WorldOfConcrete_Final_Scored_v2.csv)

**Response Shape:** (pending test call)

**Primary Key:** `domain` → `company.id`

---

## Step 0.3 — Contacts & Engagements

### Get Company Contacts
**Endpoint:** `GET https://api.hubapi.com/crm/v4/objects/companies/{companyId}/associations/contacts`

**Request:**
```bash
curl -X GET "https://api.hubapi.com/crm/v4/objects/companies/{companyId}/associations/contacts" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:** (pending test call)

### Get Contact Details
**Endpoint:** `GET https://api.hubapi.com/crm/v3/objects/contacts/{contactId}`

**Request:**
```bash
curl -X GET "https://api.hubapi.com/crm/v3/objects/contacts/{contactId}?properties=firstname,lastname,email,jobtitle,phone" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Engagements
**Endpoint:** `GET https://api.hubapi.com/crm/v4/objects/contacts/{contactId}/associations/engagements`

**Alternative:** `POST https://api.hubapi.com/crm/v3/objects/engagements/search` with filters

**Request:**
```bash
curl -X GET "https://api.hubapi.com/crm/v4/objects/contacts/{contactId}/associations/calls" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

curl -X GET "https://api.hubapi.com/crm/v4/objects/contacts/{contactId}/associations/emails" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

curl -X GET "https://api.hubapi.com/crm/v4/objects/contacts/{contactId}/associations/meetings" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:** (pending test call)

---

## Step 0.4 — App-Facing Data Spec

### Company Lookup
- **Method:** Search by `domain` (normalized from Company URL column)
- **Fallback:** If domain not found, try fuzzy match on `name`
- **Endpoint:** `POST /crm/v3/objects/companies/search`

### Company Card Fields
Display the following properties:
- `name` — Company Name
- `domain` — Domain
- `website` — Website URL
- `industry` — Industry
- `annualrevenue` — Annual Revenue
- `lifecyclestage` — Lifecycle Stage
- Custom fields (TBD based on property discovery)

### Contacts We've Spoken To
**Definition:** Associated contacts with at least one engagement (call, email, or meeting)

**TL;DR Fields:**
- `firstname` — First Name
- `lastname` — Last Name
- `jobtitle` — Job Title
- `lastEngagementType` — Type (call/email/meeting)
- `lastEngagementDate` — Date of last activity

**Detail View Fields:**
- All TL;DR fields above
- `email` — Email address
- `phone` — Phone number
- Engagement history (list of recent calls, emails, meetings with dates)

### Notes
- **Storage:** Notes may be in engagement properties or a company/contact notes field
- **Fetch:** Check engagement objects for `hs_note_body` or similar
- **Display:** Show in "NOTES" section of contact detail screen

---

## Step 0.5 — Rate Limits & Error Handling

### Rate Limits
- **Private Apps:** 100 requests per 10 seconds (to be confirmed)
- **Burst limit:** (TBD)
- **Response header:** Check `X-HubSpot-RateLimit-*` headers

### Error Handling Strategy

| Status Code | Meaning | App Response |
|------------|---------|--------------|
| 401 | Unauthorized | "HubSpot authentication failed. Check credentials." |
| 404 | Not Found | Show "No HubSpot data" / "Check directory" |
| 429 | Rate Limited | Retry after delay (check `Retry-After` header) |
| 500/502/503 | Server Error | "HubSpot temporarily unavailable. Try again later." |
| Timeout | Network issue | "Connection timeout. Check network." |

**Retry Logic:**
- On 429: Wait for `Retry-After` seconds (default 10s) before retry
- On 5xx: Exponential backoff (1s, 2s, 4s) up to 3 attempts
- On timeout: Show error, allow manual retry via "Check directory"

---

## Testing Checklist

- [ ] Step 0.1: Fetch company properties
- [ ] Step 0.1: Fetch contact properties
- [ ] Step 0.1: Populate property mapping tables
- [ ] Step 0.2: Search company by domain (`dripdrop.com`)
- [ ] Step 0.2: Document response shape and company ID extraction
- [ ] Step 0.3: Fetch contacts for test company
- [ ] Step 0.3: Fetch engagements for test contact
- [ ] Step 0.3: Determine "contacts we've spoken to" logic
- [ ] Step 0.4: Finalize data spec
- [ ] Step 0.5: Document rate limits from response headers
- [ ] Step 0.5: Test error scenarios (invalid token, non-existent domain)

---

## Next Steps

After completing discovery:
1. Create `scripts/hubspot-explore.js` with test calls (optional)
2. Update this doc with actual response examples
3. Finalize app data spec based on real HubSpot property names
4. Begin Phase 1: App implementation with HubSpot integration
