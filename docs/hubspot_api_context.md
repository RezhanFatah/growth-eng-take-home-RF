# HubSpot API Context for Mobile App

**Purpose:** How to call the HubSpot CRM API from a mobile app so users can search by **contact name** or **company name**, and view relevant fields. Based on verified discovery (scripts and test runs).

---

## Base configuration

| Item         | Value                                  |
| ------------ | -------------------------------------- |
| Base URL     | `https://api.hubapi.com`               |
| Auth         | `Authorization: Bearer <access_token>` |
| Content-Type | `application/json` (for POST)          |

**Mobile note:** Use a private app token or OAuth access token. Store the token securely (e.g. keychain); never log or expose it in client bundles.

---

## Search by company name

**Endpoint:** `POST /crm/v3/objects/companies/search`

Use this when the user types a company name in the app.

**Request body:**

```json
{
  "filterGroups": [
    {
      "filters": [
        {
          "propertyName": "name",
          "operator": "CONTAINS_TOKEN",
          "value": "*<user_query>*"
        }
      ]
    }
  ],
  "properties": [
    "name",
    "domain",
    "website",
    "industry",
    "annualrevenue",
    "lifecyclestage"
  ],
  "limit": 20,
  "sorts": [{ "propertyName": "name", "direction": "ASCENDING" }]
}
```

- **Exact match:** use `"operator": "EQ"` and `"value": "Exact Company Name"`.
- **Partial / typeahead:** use `CONTAINS_TOKEN` with a wildcard value (e.g. `"*acme*"`). Replace `<user_query>` with the sanitized search string from the app.
- **Pagination:** use `after` from the previous response’s `paging.next.after` in the next request.

**Response:** `{ "results": [{ "id", "properties": { "name", "domain", ... } }, ...], "total": <n>, "paging": { "next": { "after": "..." } } }`

**Relevant company fields for the app:**

| Property         | Label / use                                      |
| ---------------- | ------------------------------------------------ |
| `name`           | Company name                                     |
| `domain`         | Domain (e.g. for linking or domain-based lookup) |
| `website`        | Website URL                                      |
| `industry`       | Industry                                         |
| `annualrevenue`  | Annual revenue                                   |
| `lifecyclestage` | Lifecycle stage                                  |

---

## Search by contact name

**Endpoint:** `POST /crm/v3/objects/contacts/search`

Use this when the user searches by a person’s name.

**Request body:**

```json
{
  "filterGroups": [
    {
      "filters": [
        {
          "propertyName": "firstname",
          "operator": "CONTAINS_TOKEN",
          "value": "*<user_query>*"
        }
      ]
    },
    {
      "filters": [
        {
          "propertyName": "lastname",
          "operator": "CONTAINS_TOKEN",
          "value": "*<user_query>*"
        }
      ]
    }
  ],
  "properties": [
    "firstname",
    "lastname",
    "email",
    "jobtitle",
    "phone",
    "company"
  ],
  "limit": 20,
  "sorts": [{ "propertyName": "lastname", "direction": "ASCENDING" }]
}
```

- **Note:** CRM Search uses AND within a filter group. To match “firstname OR lastname”, use two filter groups (as above); the API returns contacts that match any group.
- For a single “full name” box, you can run one search with `firstname` and one with `lastname`, then merge and dedupe by `id` in the app; or send two requests and combine results.
- **Exact match:** use `"operator": "EQ"` and the exact first or last name.

**Response:** Same shape as companies: `results[]` with `id`, `properties`, plus `total` and `paging`.

**Relevant contact fields for the app:**

| Property    | Label / use                                |
| ----------- | ------------------------------------------ |
| `firstname` | First name                                 |
| `lastname`  | Last name                                  |
| `email`     | Email                                      |
| `jobtitle`  | Job title                                  |
| `phone`     | Phone                                      |
| `company`   | Associated company (if needed for display) |

---

## Optional: search company by domain

Useful when the user has a domain (e.g. from a trade show list) and you want a single company.

**Endpoint:** `POST /crm/v3/objects/companies/search`

```json
{
  "filterGroups": [
    {
      "filters": [
        {
          "propertyName": "domain",
          "operator": "EQ",
          "value": "example.com"
        }
      ]
    }
  ],
  "properties": [
    "name",
    "domain",
    "website",
    "industry",
    "annualrevenue",
    "lifecyclestage"
  ],
  "limit": 1
}
```

---

## List companies (no search term)

When you need “any” company (e.g. first page for testing or default view):

**Endpoint:** `GET /crm/v3/objects/companies`

**Query params:** `limit`, `properties` (comma-separated), `after` (pagination).

Example: `GET /crm/v3/objects/companies?limit=20&properties=name,domain,website,industry,annualrevenue,lifecyclestage`

Response shape: `{ "results": [...], "paging": { "next": { "after": "..." } } }`.

---

## Getting related data after search

Once you have a **company id** or **contact id** from search:

1. **Contacts at a company:**  
   `GET /crm/v4/objects/companies/{companyId}/associations/contacts`  
   Returns association list; use `toObjectId` as contact ids.

2. **Contact details:**  
   `GET /crm/v3/objects/contacts/{contactId}?properties=firstname,lastname,email,jobtitle,phone`

3. **Engagements for a contact (calls, emails, meetings, notes):**  
   `GET /crm/v4/objects/contacts/{contactId}/associations/{type}`  
   where `type` is one of: `calls`, `emails`, `meetings`, `notes`.

4. **Single engagement details:**  
   `GET /crm/v3/objects/{type}/{engagementId}`  
   (e.g. `calls`, `emails`, `meetings`, `notes`).

---

## Mobile app implementation notes

1. **Auth:** Send the Bearer token on every request. Handle 401 by refreshing the token or re-authenticating; do not retry the same token.
2. **Request only what you need:** Always set `properties` in search/list so responses stay small and fast on mobile.
3. **Rate limits:** HubSpot enforces per-account limits (e.g. 100 requests per 10 seconds for private apps). On 429, read `Retry-After` and back off; show a “Too many requests” message if needed.
4. **Debounce search:** For company or contact name search, debounce the input (e.g. 300–400 ms) and cancel in-flight requests when the user types again to avoid unnecessary calls and rate-limit pressure.
5. **Errors:** Map 4xx/5xx and timeouts to clear copy (e.g. “Search unavailable”, “Check connection”) and allow retry.
6. **Pagination:** Use `limit` and `after` for lists and search results so the app can infinite-scroll or “load more” without pulling too much in one request.

---

## Summary: user search flows

| User intent                  | API call                                                                                               | Key fields                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | -------- | ------- | --------------------------------------------- |
| Search by company name       | `POST /crm/v3/objects/companies/search` with filter on `name` (CONTAINS_TOKEN or EQ)                   | name, domain, website, industry, annualrevenue, lifecyclestage |
| Search by contact name       | `POST /crm/v3/objects/contacts/search` with filters on `firstname` / `lastname` (CONTAINS_TOKEN or EQ) | firstname, lastname, email, jobtitle, phone                    |
| Look up company by domain    | `POST /crm/v3/objects/companies/search` with filter on `domain` EQ                                     | same company properties                                        |
| Show contacts at company     | `GET /crm/v4/objects/companies/{id}/associations/contacts`, then contact details by id                 | firstname, lastname, email, jobtitle, phone                    |
| Show engagements for contact | `GET /crm/v4/objects/contacts/{id}/associations/{calls                                                 | emails                                                         | meetings | notes}` | use engagement ids for detail calls if needed |

All of the above endpoints and fields have been validated via the project’s HubSpot test script and discovery docs.
