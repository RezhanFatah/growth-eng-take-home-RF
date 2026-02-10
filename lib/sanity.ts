import { createClient, type SanityClient } from "@sanity/client";

function getClient(): SanityClient | null {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!projectId) return null;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
  const token = process.env.SANITY_API_READ_TOKEN;
  return createClient({
    projectId,
    dataset,
    apiVersion: "2024-01-01",
    useCdn: true,
    token: token || undefined,
  });
}

export const sanityClient = getClient();

export const conventionsQuery = `*[_type == "convention"] | order(dates desc) {
  _id,
  name,
  "slug": slug.current,
  dates,
  location,
  attendeeCount,
  "targetListUrl": targetListCsv.asset->url,
  "attendeeListUrl": attendeeListCsv.asset->url
}`;

export const conventionBySlugQuery = `*[_type == "convention" && slug.current == $slug][0] {
  _id,
  name,
  "slug": slug.current,
  dates,
  location,
  attendeeCount,
  "targetListUrl": targetListCsv.asset->url,
  "attendeeListUrl": attendeeListCsv.asset->url
}`;

export type ConventionListItem = {
  _id: string;
  name: string;
  slug: string;
  dates?: string;
  location?: string;
  attendeeCount?: number;
  targetListUrl?: string;
  attendeeListUrl?: string;
};
