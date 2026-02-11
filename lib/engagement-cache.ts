import { ENGAGEMENT_CACHE_TTL_MS } from "./engagement-config";

export type EngagementItem = {
  id: string;
  type: "call" | "email" | "meeting" | "note";
  timestamp: string;
  title?: string;
  body?: string;
  direction?: string;
  duration?: string;
  contactName?: string;
};

export type CachedEngagements = {
  engagements: EngagementItem[];
  displaySummaries: string[];
  contextSummary: string;
  fetchedAt: number;
};

const cache = new Map<string, CachedEngagements>();

function isExpired(entry: CachedEngagements): boolean {
  return Date.now() - entry.fetchedAt > ENGAGEMENT_CACHE_TTL_MS;
}

export function getCachedEngagements(key: string): CachedEngagements | null {
  const entry = cache.get(key);
  if (!entry || isExpired(entry)) {
    if (entry) cache.delete(key);
    return null;
  }
  return entry;
}

export function setCachedEngagements(key: string, data: Omit<CachedEngagements, "fetchedAt">): void {
  cache.set(key, { ...data, fetchedAt: Date.now() });
}

export function engagementCacheKey(type: "contact" | "company", id: string): string {
  return `${type}:${id}`;
}
