# Trade Show Prospecting App

Mobile-first web app for sales teams at trade shows: browse convention directories, search HubSpot CRM, chat with AI about companies and contacts (with engagement history in context), and capture structured notes.

---

## Tech stack

| Layer | Technology |
| ----- | ---------- |
| **Framework** | **Next.js 16** (App Router), **React 18** |
| **Build** | Turbopack (dev), TypeScript 5 |
| **Styling** | **Tailwind CSS** |
| **Icons** | **Heroicons** (outline/solid) |
| **CMS** | **Sanity** – conventions, CSV references (target/attendee lists) |
| **CRM** | **HubSpot** – companies, contacts, engagements (calls, emails, meetings, notes) |
| **AI** | **Anthropic (Claude)** – chat replies, note structuring, engagement summaries |

### Key libraries

- `@anthropic-ai/sdk` – Claude API (chat, notes, engagement summaries)
- `@sanity/client` – Sanity GROQ and asset URLs
- `react-markdown` – Rendered chat and note content

---

## Capabilities

### 1. Events (Conventions)

- List conventions from Sanity (name, slug, dates, location, attendee count).
- Open a convention to view its **directory**: exhibitors (target list) and attendees (attendee list), from CSVs stored in Sanity.
- Search directory by name, company, or location; results show fit score, tier, and key fields.
- Tap a row to see full contact/company details (email, phone, website, revenue, platform, etc.).

**Why Sanity:** Single place to define events and attach CSV assets; no backend DB needed for directory data.

### 2. CRM

- Search HubSpot by **company name** or **contact name** (or domain for companies).
- View company detail (name, domain, website, industry, revenue, lifecycle) and associated contacts.
- View contact detail (name, email, phone, title, company).
- **Recent activity:** Last N engagements (calls, emails, meetings, notes) with **AI summaries** on contact and company pages. Engagement history is also included in **chat context** for the AI. Configurable via `HUBSPOT_ENGAGEMENTS_LIMIT` (default 3); data cached for the session (15 min TTL). Non-blocking errors with “Try again.”
- Links to “Check directory” when no HubSpot record exists.

**Why HubSpot:** Source of truth for CRM; read-only private app token keeps the app simple and secure.

### 3. Chat

- Search by company or contact name; search runs across **directory + HubSpot**.
- Pick a result to open a **thread** with context (directory entry and/or HubSpot company/contacts **plus engagement summary**) sent to the model.
- Ask natural-language questions (e.g. “What’s their revenue?”, “Who have we talked to?”); answers are grounded in loaded data only.
- **Web search:** When configured (Tavily or Serper), the model can use a `search_web` tool for current info and must cite sources.
- **Recent conversations** stored in `localStorage`; **thread messages** persisted per thread in `localStorage` so they survive refresh.
- Swipe left on a recent chat to reveal **delete** (trash).

**Why Anthropic:** Reliable, context-aware replies for sales Q&A without hallucinating beyond provided data.

### 4. Notes

- **New note:** Paste or type raw text; optional **“Structure with AI”** sends it to `/api/notes/process` (Claude) to extract contact, company, interaction type, summary, key points, next steps, dates, priority, tags, sentiment.
- Structured notes are stored in **localStorage** with the extracted JSON; raw text is always kept.
- **Notes list:** Search by contact, company, location, or raw text; each card shows title, summary (or raw preview), status (processing/completed/error), priority, date.
- **Note detail:** For AI-structured notes, view all extracted fields. For non-structured notes, view a **brief preview** with “Show full note” to expand. **3-dot menu:** **Download note** (`.txt` / `.md`), **Delete note**.

**Why localStorage:** No backend or auth required; notes stay on device. Optional future: sync to HubSpot or Supabase.

---

## Pipelines

### Engagement pipeline (HubSpot → UI & Chat)

1. **Config** (`lib/engagement-config.ts`): `ENGAGEMENTS_LIMIT` from `HUBSPOT_ENGAGEMENTS_LIMIT` (1–20, default 3), `ENGAGEMENT_CACHE_TTL_MS` (15 min).
2. **Fetch** (`lib/hubspot-engagements.ts`): For contacts – associations for calls, emails, meetings, notes; fetch details; normalize; sort by timestamp; take last N. For companies – get contact IDs (capped at 10), fetch engagements per contact, merge/sort/take last N.
3. **Summaries** (`lib/engagement-summary.ts`): Single Anthropic call returns `displaySummaries` (one short summary per engagement for UI) and `contextSummary` (one comprehensive summary for chat context).
4. **Cache** (`lib/engagement-cache.ts`): In-memory cache keyed by `contact:{id}` or `company:{id}`; TTL 15 min.
5. **API** (`/api/hubspot/contacts/[id]/engagements`, `/api/hubspot/companies/[id]/engagements`): Check cache → else fetch, summarize, cache, return. On failure return 503/429 with retry message.
6. **UI** (`components/EngagementsSection.tsx`): Fetches engagements URL; shows list (date, type, display summary or “Summary unavailable”); on error shows “Couldn’t load engagement history” + “Try again.”
7. **Chat context** (`/api/chat/context`): For company/contact, uses cached or freshly fetched engagement data and appends `buildContextFromEngagements(contextSummary)` to context.

### Chat context pipeline

- **Input:** `type` (company | contact | directory), `id`, and for directory `slug`.
- **Resolve:** Load company/contact from HubSpot or directory entry from Sanity CSVs; optionally load engagements (cache or fetch+summarize).
- **Output:** `{ name, context }` where `context` is plain text built from `lib/chat-context.ts` (directory, HubSpot company/contact, and engagement summary).

### Notes structuring pipeline

- **Input:** `rawText`, `noteId` to `/api/notes/process`.
- **Processing:** Claude extracts structured JSON (contact, company, interaction type, summary, key points, next steps, dates, priority, tags, sentiment).
- **Output:** `{ structured }`; client stores in localStorage with raw text.

---

## APIs

All routes are under `app/api/`. Method and path only are listed where the route is GET and returns JSON.

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET | `/api/conventions` | List conventions (Sanity). |
| GET | `/api/conventions/[slug]/directory?q=` | Directory for convention: exhibitors, attendees, optional search `q`. |
| GET | `/api/hubspot/companies/search?q=` | Search companies by name (HubSpot). |
| GET | `/api/hubspot/companies/[id]` | Company detail + associated contacts. |
| GET | `/api/hubspot/companies/[id]/engagements` | Recent engagements for company (cached, with AI display + context summaries). |
| GET | `/api/hubspot/contacts/search?q=` | Search contacts by name (HubSpot). |
| GET | `/api/hubspot/contacts/[id]` | Contact detail; optional `?associations=companies`. |
| GET | `/api/hubspot/contacts/[id]/engagements` | Recent engagements for contact (cached, with AI display + context summaries). |
| GET | `/api/chat/context?type=&id=&slug=` | Resolve context for chat: `type` = company \| contact \| directory; `id` required; `slug` required for directory. |
| GET | `/api/chat/search?q=&convention=` | Unified search: directory + HubSpot companies + contacts; optional `convention` slug. |
| POST | `/api/chat` | Chat completion: body `{ message, context? }`; optional web search via tool. |
| POST | `/api/notes/process` | Structure note with AI: body `{ rawText, noteId }`; returns `{ structured }`. |

---

## Integrations

| Service | Role | Auth | Notes |
| ------- | ---- | ---- | ----- |
| **Sanity** | CMS for conventions and CSV URLs | `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, optional `SANITY_API_READ_TOKEN` | GROQ queries; asset URLs for target/attendee CSVs. |
| **HubSpot** | CRM (companies, contacts, engagements) | `HUBSPOT_ACCESS_TOKEN` (private app, read-only) | v3/v4 APIs: search, objects, associations; engagements = calls, emails, meetings, notes. |
| **Anthropic (Claude)** | Chat, note structuring, engagement summaries | `ANTHROPIC_API_KEY` | Same key for chat, notes, and engagement summary generation. |
| **Tavily** | Web search for chat | `TAVILY_API_KEY` | Preferred when set; used by chat `search_web` tool. |
| **Serper** | Web search fallback | `SERPER_API_KEY` | Used when Tavily missing or fails. |

---

## Services and environment variables

Create `.env.local` in the project root (no `.env.example` is committed for security). Use the table below.

| Variable | Required | Used by | Purpose |
| -------- | -------- | ------- | ------- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes (Events) | Next app + Studio | Sanity project ID. |
| `NEXT_PUBLIC_SANITY_DATASET` | No (default: `production`) | Next app + Studio | Sanity dataset. |
| `SANITY_API_READ_TOKEN` | No (public read) | Next app | If dataset is private. |
| `HUBSPOT_ACCESS_TOKEN` | Yes (CRM & Chat) | HubSpot API routes | Private app token (read-only). |
| `ANTHROPIC_API_KEY` | Yes (Chat & Notes & Engagements) | Chat, Notes, engagement summaries | Claude for chat, note structuring, and engagement summaries. |
| `TAVILY_API_KEY` | No | Chat (web search) | Web search (preferred when set). |
| `SERPER_API_KEY` | No | Chat (web search) | Fallback web search if Tavily missing/fails. |
| `HUBSPOT_ENGAGEMENTS_LIMIT` | No (default: `3`) | CRM engagements | Number of recent engagements (1–20) to show per contact/company. |

**Why these:**

- **Sanity:** Hosts convention documents and CSV assets; Studio is used to create conventions and upload target/attendee CSVs.
- **HubSpot:** Single read-only token for companies, contacts, and engagements; no OAuth in the app.
- **Anthropic:** One key for chat, notes structuring, and engagement summary generation.
- **Tavily / Serper:** Optional; only for “search the web” in chat when directory + CRM have no match or user asks for current info.

---

## Project layout

| Path | Purpose |
| ---- | ------- |
| `app/` | Next.js App Router: pages and API routes. |
| `app/api/` | Chat (context, search, POST), conventions, HubSpot (companies/contacts + engagements), notes (process). |
| `app/chat/`, `app/conventions/`, `app/crm/`, `app/notes/` | Page routes for chat, events, CRM, notes. |
| `components/` | BottomNav, EngagementsSection, NoteCard, SwipeableRecentRow. |
| `lib/` | Sanity client, CSV/directory parsing, chat-context builder, engagement-config, engagement-cache, hubspot-engagements, engagement-summary, notes localStorage helpers. |
| `studio/` | Sanity Studio and convention schema (run separately for content editing). |
| `public/` | Static assets. |

---

## Setup (new users)

### 1. Clone and install

```bash
git clone <repo-url>
cd growth-eng-take-home-RF
npm install
```

### 2. Environment variables

Create `.env.local` in the project root:

```bash
# Required for full app
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
HUBSPOT_ACCESS_TOKEN=your_hubspot_private_app_token
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=           # only if dataset is private
HUBSPOT_ENGAGEMENTS_LIMIT=3      # 1–20, default 3
TAVILY_API_KEY=                  # web search in chat (preferred)
SERPER_API_KEY=                  # web search fallback
```

At minimum, set `NEXT_PUBLIC_SANITY_PROJECT_ID`, `HUBSPOT_ACCESS_TOKEN`, and `ANTHROPIC_API_KEY` for full Chat, Notes, and CRM (including engagements).

### 3. Sanity Studio (for Events/directory)

1. Create a project at [sanity.io](https://sanity.io); set `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` in `.env.local`.
2. Run Studio to add conventions and upload CSVs:

```bash
cd studio
npm install
npm run dev
```

3. In Studio, create at least one **Convention** with **Name**, **Slug**, **Dates**, **Location**, and optionally **Target list (CSV)** and **Attendee list (CSV)** (uploaded as assets). Directory search and contact detail use these CSVs.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

### Vercel (recommended)

1. Push the repo to GitHub and import the project in [Vercel](https://vercel.com).
2. In **Settings → Environment Variables**, add the same variables as in `.env.local` (see table above). Use **Production**, **Preview**, and **Development** as needed.
3. Deploy. The app is static/API where needed; notes and recent chats are client-side localStorage only.

**Sanity Studio** for editors: either run `npx sanity deploy` from `studio/` for Sanity’s hosted Studio, or deploy the `studio` app as a second Vercel project with root `studio`.

### Other platforms

- **Build:** `npm run build`
- **Start:** `npm run start`
- Ensure all env vars are set in the host’s environment. No database or server persistence is required for the Next app.

---

## Files unnecessary for the app to run

These are **not required** for `npm run dev` or `npm run build` and can be omitted or added to `.gitignore`:

| Item | Reason |
| ---- | ------ |
| `.env` / `.env.local` | Secrets; already in `.gitignore`. Never commit. |
| `.next/` | Build output; in `.gitignore`. |
| `node_modules/` | Dependencies; in `.gitignore`. |
| `Assets/` | Duplicate of assets in `public/icons/`. App uses Heroicons; safe to remove from repo. |
| `public/icons/` | PNG/SVG not referenced (conventions/chat use Heroicons). Optional to remove. |
| `data/` | Example/reference CSVs. Directory data at runtime comes from Sanity. Optional for seeding. |
| `docs/` | HubSpot API and discovery notes. Optional for onboarding. |
| `.claude/` | Editor/IDE config. Add to `.gitignore` if you don’t want it in the repo. |
| `studio/.sanity/` | Sanity Studio runtime/cache. Add `studio/.sanity/` to `.gitignore` if present. |

**Suggested `.gitignore` additions:**

```
# Planning / editor
.claude/

# Sanity Studio
studio/.sanity/
```

Removing `Assets/`, `data/`, `docs/`, and `public/icons/` (if unused) will keep the repo lighter; the app will still run and build.
