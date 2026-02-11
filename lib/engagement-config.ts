/** Number of recent engagements to fetch and display. Set HUBSPOT_ENGAGEMENTS_LIMIT in env to override. */
export const ENGAGEMENTS_LIMIT = Math.max(
  1,
  Math.min(20, parseInt(process.env.HUBSPOT_ENGAGEMENTS_LIMIT ?? "3", 10) || 3)
);

/** Session cache TTL in milliseconds (15 min). */
export const ENGAGEMENT_CACHE_TTL_MS = 15 * 60 * 1000;
