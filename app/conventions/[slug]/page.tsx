"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowsUpDownIcon } from "@heroicons/react/24/outline";

type Convention = {
  _id: string;
  name: string;
  slug: string;
  dates?: string;
  location?: string;
  attendeeCount?: number;
};

type DirectoryEntry = {
  id: string;
  source: "target" | "attendee";
  companyName: string;
  companyDomain: string;
  personName?: string;
  personTitle?: string;
  location?: string;
  score?: number;
  tier?: string;
  fitReasons?: string;
  revenueNum?: number;
  raw: Record<string, string>;
};

type SortBy = "name" | "score" | "revenue";

/** Returns Tailwind classes for score badge: green (strong), orange (mid), red (weak). */
function scoreColor(score?: number): string {
  if (score == null) return "";
  if (score >= 80) return "bg-green-500/20 text-green-400";
  if (score >= 50) return "bg-orange-500/20 text-orange-400";
  return "bg-red-500/20 text-red-400";
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return ((parts[0][0] ?? "") + (parts[1][0] ?? "")).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function ConventionDirectoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [convention, setConvention] = useState<Convention | null>(null);
  const [exhibitors, setExhibitors] = useState<DirectoryEntry[]>([]);
  const [attendees, setAttendees] = useState<DirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("name");

  const load = useCallback(() => {
    if (!slug) return;
    setLoading(true);
    const url = `/api/conventions/${slug}/directory${query ? `?q=${encodeURIComponent(query)}` : ""}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load directory");
        return r.json();
      })
      .then((data) => {
        setConvention(data.convention);
        setExhibitors(data.exhibitors ?? []);
        setAttendees(data.attendees ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug, query]);

  useEffect(() => {
    const t = setTimeout(load, query ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  const displayName = (e: DirectoryEntry) =>
    e.personName || e.companyName;
  const subline = (e: DirectoryEntry) =>
    [e.personTitle, e.companyName].filter(Boolean).join(" · ");

  const sortEntries = useCallback(
    (list: DirectoryEntry[]): DirectoryEntry[] => {
      const nameFor = (e: DirectoryEntry) => (displayName(e) || "").toLowerCase();
      if (sortBy === "name") {
        return [...list].sort((a, b) => nameFor(a).localeCompare(nameFor(b)));
      }
      if (sortBy === "score") {
        return [...list].sort((a, b) => {
          const sa = a.score ?? -1;
          const sb = b.score ?? -1;
          return sb - sa;
        });
      }
      if (sortBy === "revenue") {
        return [...list].sort((a, b) => {
          const ra = a.revenueNum ?? -1;
          const rb = b.revenueNum ?? -1;
          return rb - ra;
        });
      }
      return list;
    },
    [sortBy]
  );

  const sortedExhibitors = sortEntries(exhibitors);
  const sortedAttendees = sortEntries(attendees);

  return (
    <main className="p-4 min-h-screen">
      <div className="flex items-center gap-2 mt-2">
        <Link
          href="/conventions"
          className="text-orange-500 hover:underline text-sm flex items-center gap-1"
        >
          ← Conventions
        </Link>
      </div>
      {convention && (
        <>
          <h1 className="text-center text-lg font-medium text-zinc-200 mt-2">{convention.name}</h1>
          {(convention.dates || convention.location) && (
            <p className="text-center text-zinc-400 text-sm mt-1">
              {[convention.dates, convention.location].filter(Boolean).join(" · ")}
            </p>
          )}
        </>
      )}
      <div className="mt-4">
        <input
          type="search"
          placeholder="Search name, company, or location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-zinc-900/50 border-0 rounded-full px-5 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700"
        />
        <div className="mt-3 flex items-center gap-2">
          <ArrowsUpDownIcon className="w-5 h-5 text-zinc-500 shrink-0" aria-hidden />
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            aria-label="Sort by"
            className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="name">Name A–Z</option>
            <option value="score">Fit score</option>
            <option value="revenue">Revenue</option>
          </select>
        </div>
      </div>
      {loading && !convention ? (
        <div className="mt-8 text-zinc-500 text-center">Loading…</div>
      ) : error ? (
        <p className="mt-4 text-red-400">{error}</p>
      ) : (
        <div className="mt-6 space-y-6">
          <section>
            <h2 className="text-center text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Target list ({exhibitors.length})
            </h2>
            <p className="text-center text-zinc-500 text-xs mb-2">Who we want to approach</p>
            <ul className="mt-2 space-y-2">
              {sortedExhibitors.slice(0, 50).map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/conventions/${slug}/contact/${encodeURIComponent(e.id)}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/50 hover:bg-zinc-800"
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-sm font-bold shrink-0">
                      {initials(displayName(e))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{displayName(e)}</div>
                      <div className="text-zinc-400 text-sm truncate">
                        {subline(e)}
                      </div>
                    </div>
                    {e.score != null && (
                      <span
                        className={`shrink-0 min-w-[1.75rem] h-7 px-1.5 rounded-full flex items-center justify-center text-xs font-bold ${scoreColor(e.score)}`}
                      >
                        {e.score}
                      </span>
                    )}
                    <span className="text-zinc-500">›</span>
                  </Link>
                </li>
              ))}
            </ul>
            {exhibitors.length > 50 && (
              <p className="text-zinc-500 text-sm mt-2">
                Showing 50 of {exhibitors.length}. Refine search to narrow.
              </p>
            )}
          </section>
          <section>
            <h2 className="text-center text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Exhibitors ({attendees.length})
            </h2>
            <p className="text-center text-zinc-500 text-xs mb-2">Exhibitors at this event</p>
            <ul className="mt-2 space-y-2">
              {sortedAttendees.slice(0, 50).map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/conventions/${slug}/contact/${encodeURIComponent(e.id)}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/50 hover:bg-zinc-800"
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-sm font-bold shrink-0">
                      {initials(displayName(e))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{displayName(e)}</div>
                      <div className="text-zinc-400 text-sm truncate">
                        {subline(e)}
                      </div>
                    </div>
                    {e.score != null && (
                      <span
                        className={`shrink-0 min-w-[1.75rem] h-7 px-1.5 rounded-full flex items-center justify-center text-xs font-bold ${scoreColor(e.score)}`}
                      >
                        {e.score}
                      </span>
                    )}
                    <span className="text-zinc-500">›</span>
                  </Link>
                </li>
              ))}
            </ul>
            {attendees.length > 50 && (
              <p className="text-zinc-500 text-sm mt-2">
                Showing 50 of {attendees.length}. Refine search to narrow.
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
