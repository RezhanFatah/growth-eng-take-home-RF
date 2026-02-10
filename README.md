# Trade Show Prospecting App

Mobile-friendly app for sales at trade shows: search conventions (directory), HubSpot CRM, and chat with context about companies and contacts.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes (for Conventions) | Sanity project ID from [sanity.io](https://sanity.io) |
| `NEXT_PUBLIC_SANITY_DATASET` | No (default: `production`) | Sanity dataset name |
| `SANITY_API_READ_TOKEN` | No (public read) | Sanity API token if dataset is private |
| `HUBSPOT_ACCESS_TOKEN` | Yes (for CRM & Chat) | HubSpot private app token (read-only) |
| `ANTHROPIC_API_KEY` | Yes (for Chat) | Anthropic API key for chat replies |
| `SERPER_API_KEY` or `TAVILY_API_KEY` | No | Optional; for "Search the web" (otherwise placeholder) |

### 3. Sanity Studio (conventions & CSVs)

1. Create a project at [sanity.io](https://sanity.io) and note the **Project ID** and **Dataset**.
2. Add them to `.env.local` as `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET`.
3. Run Sanity Studio to add conventions and upload CSVs:

```bash
cd studio
npm install
cp .env.example .env
# Edit studio/.env and set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET (same as root .env.local)
npm run dev
```

4. Open the Studio URL (e.g. `http://localhost:3333`), log in, and create at least one **Convention** document:
   - **Name**, **Slug** (e.g. `world-of-concrete`), **Dates**, **Location**, **Attendee count** (optional)
   - **Target list (CSV)**: upload a company-level CSV (e.g. WoC-style: Company, Website, Platform, Revenue, Score, Tier, Fit Reasons)
   - **Attendee list (CSV)**: upload a person-level CSV (e.g. Shoptalk-style: First Name, Last Name, Job Title, Company, Company URL)

Example data is in `data/reference/WoC/WorldOfConcrete_Final_Scored_v2.csv` (target) and `data/shoptalk-attendees-2025.csv` (attendee).

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How the sales team uses it

1. **Conventions** – Tap a convention to open its directory. Search by name, company, or location. Results are split into **Exhibitors** (target list) and **Attendees** (attendee list). Tap a row to see full details (fit score, revenue, platform, etc.).
2. **CRM** – Search HubSpot by company or contact name. Tap a result to see company details and contacts we’ve spoken to. If there’s no HubSpot record, use **Check directory** to look in convention lists.
3. **Chat** – Search by company or contact name (searches both directory and HubSpot). Select a result, then ask questions in natural language (e.g. “What’s their revenue?”, “Who have we talked to?”). Answers use only the loaded data (no hallucination). If nothing is found, **Search the web for [name]** opens a web-snippet view (requires `SERPER_API_KEY` or `TAVILY_API_KEY` for real results).

Recent chat conversations are stored in the browser (localStorage) for quick re-entry.

## Deploy (Vercel)

1. Push the repo to GitHub and import the project in Vercel.
2. Set the environment variables above in the Vercel project (Settings → Environment Variables).
3. Deploy. The app will be available at `https://your-project.vercel.app`.

To deploy **Sanity Studio** as a separate app (e.g. for content editors):

- In the `studio` folder, run `npm run deploy` (after `npx sanity login`) to use Sanity’s hosted Studio, or
- Add a second Vercel project that builds the `studio` app and set its root to `studio` (or use a monorepo setup).

## Tech stack

- **Next.js 15** (App Router), **React 18**, **Tailwind CSS**
- **Sanity** – Convention CMS (schema in `studio/schemas/convention.ts`)
- **HubSpot** – CRM search and company/contact detail (see `docs/hubspot_api_context.md`)
- **Anthropic** – Chat (Claude) with context from directory + HubSpot

## Project layout

- `app/` – Next.js pages and API routes
- `components/` – Shared UI (e.g. bottom nav)
- `lib/` – Sanity client, CSV parsing, directory index, chat context builder
- `studio/` – Sanity Studio and convention schema
- `data/` – Example CSVs and ICP criteria
- `docs/` – HubSpot API context and discovery notes
