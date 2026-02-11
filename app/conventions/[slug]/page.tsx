"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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
  raw: Record<string, string>;
};

function scoreBadge(score?: number): string {
  if (score == null) return "";
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  return "C";
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
      </div>
      {loading && !convention ? (
        <div className="mt-8 text-zinc-500 text-center">Loading…</div>
      ) : error ? (
        <p className="mt-4 text-red-400">{error}</p>
      ) : (
        <div className="mt-6 space-y-6">
          <section>
            <h2 className="text-center text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Exhibitors ({exhibitors.length})
            </h2>
            <ul className="mt-2 space-y-2">
              {exhibitors.slice(0, 50).map((e) => (
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
                    {scoreBadge(e.score) && (
                      <span
                        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${scoreBadge(e.score) === "A"
                            ? "bg-green-500/20 text-green-400"
                            : scoreBadge(e.score) === "B"
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                      >
                        {scoreBadge(e.score)}
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
              Attendees ({attendees.length})
            </h2>
            <ul className="mt-2 space-y-2">
              {attendees.slice(0, 50).map((e) => (
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
                    {scoreBadge(e.score) && (
                      <span className="shrink-0 w-7 h-7 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold">
                        {scoreBadge(e.score)}
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
