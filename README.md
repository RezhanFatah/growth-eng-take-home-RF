# Trade Show Prospecting App

Mobile-first web app for sales teams at trade shows: browse convention directories, search HubSpot CRM, chat with AI about companies and contacts, and capture structured notes.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | **Next.js 16** (App Router), **React 18** |
| Styling | **Tailwind CSS** |
| Icons | **Heroicons** (outline/solid) |
| CMS | **Sanity** – conventions, CSV references |
| CRM | **HubSpot** – companies & contacts (read-only) |
| AI | **Anthropic (Claude)** – chat replies and note structuring |

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
- Links to “Check directory” when no HubSpot record exists.

**Why HubSpot:** Already the source of truth for CRM; read-only private app token keeps the app simple and secure.

### 3. Chat

- Search by company or contact name; search runs across **directory + HubSpot**.
- Pick a result to open a **thread** with context (directory entry and/or HubSpot company/contacts) sent to the model.
- Ask natural-language questions (e.g. “What’s their revenue?”, “Who have we talked to?”); answers are grounded in loaded data only.
- **Recent conversations** stored in `localStorage`; **thread messages** persisted per thread in `localStorage` so they survive refresh.
- Swipe left on a recent chat to reveal **delete** (trash).
- If no directory/CRM result, option to **search the web** (Tavily or Serper); results can be used as context for follow-up (when configured).

**Why Anthropic:** Reliable, context-aware replies for sales Q&A without hallucinating beyond provided data.

### 4. Notes

- **New note:** Paste or type raw text; optional **“Structure with AI”** sends it to `/api/notes/process` (Claude) to extract contact, company, interaction type, summary, key points, next steps, dates, priority, tags, sentiment.
- Structured notes are stored in **localStorage** with the extracted JSON; raw text is always kept.
- **Notes list:** Search by contact, company, location, or raw text; each card shows title, summary (or raw preview), status (processing/completed/error), priority, date.
- **Note detail:** For AI-structured notes, view all extracted fields (summary, key points, next steps, tags, etc.). For non-structured notes, view a **brief preview** of raw text with “Show full note” to expand. **3-dot menu** in the header: **Download note** (`.txt` for raw, `.md` for structured), **Delete note**.

**Why localStorage:** No backend or auth required; notes stay on device. Optional future step: sync to HubSpot or Supabase.

---

## Services and environment variables

Create `.env.local` in the project root (no `.env.example` is committed for security). Use the table below.

| Variable | Required | Used by | Purpose |
|----------|----------|---------|---------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes (Events) | Next app + Studio | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | No (default: `production`) | Next app + Studio | Sanity dataset |
| `SANITY_API_READ_TOKEN` | No (public read) | Next app | If dataset is private |
| `HUBSPOT_ACCESS_TOKEN` | Yes (CRM & Chat) | HubSpot API routes | Private app token (read-only) |
| `ANTHROPIC_API_KEY` | Yes (Chat & Notes) | Chat + Notes process | Claude for chat and note structuring |
| `TAVILY_API_KEY` | No | Chat (web search) | Web search (preferred when set) |
| `SERPER_API_KEY` | No | Chat (web search) | Fallback web search if Tavily missing/fails |

**Why these:**

- **Sanity:** Hosts convention documents and CSV assets; Studio is used to create conventions and upload target/attendee CSVs.
- **HubSpot:** Single read-only token for companies and contacts search + detail; no OAuth in the app.
- **Anthropic:** One key for both chat (contextual Q&A) and notes structuring (JSON extraction).
- **Tavily / Serper:** Optional; only for “search the web” when directory + CRM have no match.

---

## Project layout

| Path | Purpose |
|------|---------|
| `app/` | Next.js App Router: pages and API routes |
| `app/api/` | Chat (context, search, POST), conventions, HubSpot (companies/contacts), notes (process) |
| `components/` | BottomNav, NoteCard, SwipeableRecentRow |
| `lib/` | Sanity client, CSV/directory parsing, chat context builder, notes localStorage helpers |
| `studio/` | Sanity Studio and convention schema (run separately for content editing) |
| `public/` | Static assets (e.g. icons if used) |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create `.env.local` in the project root and set the variables from the table above. At minimum: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `HUBSPOT_ACCESS_TOKEN`, `ANTHROPIC_API_KEY` (for full Chat and Notes AI).

### 3. Sanity Studio (for Events/directory)

1. Create a project at [sanity.io](https://sanity.io); set `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` in `.env.local`.
2. Run Studio to add conventions and upload CSVs:

```bash
cd studio
npm install
# Optional: studio/.env with same Sanity vars if you run Studio standalone
npm run dev
```

3. In Studio, create at least one **Convention** with **Name**, **Slug**, **Dates**, **Location**, and optionally **Target list (CSV)** and **Attendee list (CSV)** (uploaded as assets). Directory search and contact detail use these CSVs.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy (e.g. Vercel)

1. Push the repo to GitHub and import the project in Vercel.
2. Set the same environment variables in Vercel (Settings → Environment Variables).
3. Deploy. The app is static/API-only where needed; no server persistence (notes and recent chats are client-side localStorage).

To run **Sanity Studio** for editors, either use `npx sanity deploy` from `studio/` for Sanity’s hosted Studio or deploy the `studio` app as a second Vercel project with root `studio`.

---

## Files unnecessary for the app to run (do not commit / remove to keep repo light)

These are **not required** for `npm run dev` or `npm run build` and can be omitted from the repo or added to `.gitignore` so they are not pushed:

| Item | Reason |
|------|--------|
| **`.env` / `.env.local`** | Secrets; already in `.gitignore`. Never commit. |
| **`.next/`** | Build output; in `.gitignore`. |
| **`node_modules/`** | Dependencies; in `.gitignore`. |
| **`trade_show_prospecting_app_10cc860b.plan.md`** | Planning doc; not needed for build or runtime. |
| **`Assets/`** | Duplicate of assets that were copied to `public/icons/`. The app uses Heroicons in code; no imports reference `Assets/`. Safe to remove from repo. |
| **`public/icons/`** | PNG/SVG under `public/icons/` are not referenced in the app (conventions and chat use Heroicons). Can be removed if you want a leaner repo. |
| **`data/`** | Example/reference CSVs and `ICP-criteria.md`. Directory data at runtime comes from Sanity (CSV URLs on conventions), not from `data/`. Optional for “how to seed”; not needed for run. |
| **`docs/`** | HubSpot API and discovery notes for developers. Not imported by the app; optional for onboarding. |
| **`.claude/`** | Editor/IDE config. Often not committed; add to `.gitignore` if you don’t want it in the repo. |
| **`studio/.sanity/`** | Sanity Studio runtime/cache. Not needed for the Next app; add `studio/.sanity/` to `.gitignore` if present. |

**Suggested `.gitignore` additions** (if you want to stop tracking these):

```
# Planning / editor
trade_show_prospecting_app_10cc860b.plan.md
.claude/

# Sanity Studio
studio/.sanity/
```

Removing **`Assets/`**, **`data/`**, **`docs/`**, and **`public/icons/`** (if you confirm icons are unused) will make the repo lighter; the app will still run and build.
