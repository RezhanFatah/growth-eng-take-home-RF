"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { ChevronRightIcon, BuildingOfficeIcon, BriefcaseIcon } from "@heroicons/react/24/outline";

type CompanyResult = {
  id: string;
  properties: {
    name?: string;
    domain?: string;
    website?: string;
    industry?: string;
    annualrevenue?: string;
    lifecyclestage?: string;
  };
};

type ContactResult = {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    jobtitle?: string;
    phone?: string;
    company?: string;
  };
};

export default function CRMPage() {
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState<CompanyResult[]>([]);
  const [contacts, setContacts] = useState<ContactResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(() => {
    const q = query.trim();
    if (!q) {
      setCompanies([]);
      setContacts([]);
      return;
    }
    setLoading(true);
    setError(null);
    const isDomain = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(q) && !/\s/.test(q);
    Promise.all([
      fetch("/api/hubspot/companies/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isDomain ? { domain: q } : { q }),
      }).then((r) => r.json()),
      fetch("/api/hubspot/contacts/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q }),
      }).then((r) => r.json()),
    ])
      .then(([companyData, contactData]) => {
        if (companyData.error) throw new Error(companyData.error);
        if (contactData.error) throw new Error(contactData.error);
        setCompanies(companyData.results ?? []);
        setContacts(contactData.results ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [query]);

  const debouncedSearch = useCallback(() => {
    const t = setTimeout(search, 350);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <main className="p-4 min-h-screen">
      <h1 className="text-center text-lg font-medium text-zinc-200 mt-2">CRM</h1>
      <p className="text-center text-zinc-400 text-sm mt-1">
        Search HubSpot by company or contact name.
      </p>
      <div className="mt-4 flex gap-2 items-center">
        <input
          type="search"
          placeholder="Company or contact name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          className="flex-1 bg-zinc-900/50 border-0 rounded-full px-5 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700"
        />
        <button
          type="button"
          onClick={search}
          className="bg-orange-500 text-white p-3 rounded-full hover:bg-orange-600 transition-all active:scale-95 shrink-0 shadow-lg shadow-orange-500/20"
          aria-label="Search"
        >
          <MagnifyingGlassIcon className="w-5 h-5" />
        </button>
      </div>
      {error && (
        <p className="mt-3 text-red-400 text-sm">
          {error}. <Link href="/conventions" className="text-orange-500 underline">Check directory</Link> instead.
        </p>
      )}
      {loading && <p className="mt-3 text-zinc-500 text-sm">Searching…</p>}
      {!loading && (companies.length > 0 || contacts.length > 0) && (
        <div className="mt-6 space-y-6">
          {companies.length > 0 && (
            <section>
              <h2 className="text-center text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Companies ({companies.length})
              </h2>
              <ul className="space-y-2">
                {companies.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/crm/company/${c.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/50 hover:bg-zinc-800"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-sm font-bold shrink-0">
                        {(c.properties.name ?? "?").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {c.properties.name ?? "—"}
                        </div>
                        {(c.properties.domain || c.properties.industry) && (
                          <div className="text-zinc-400 text-xs truncate mt-1">
                            {c.properties.domain ?? c.properties.industry}
                          </div>
                        )}
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-zinc-600 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {contacts.length > 0 && (
            <section>
              <h2 className="text-center text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Contacts ({contacts.length})
              </h2>
              <ul className="space-y-2">
                {contacts.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/crm/contact/${c.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/50 hover:bg-zinc-800"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-sm font-bold shrink-0">
                        {[
                          c.properties.firstname?.[0],
                          c.properties.lastname?.[0],
                        ]
                          .filter(Boolean)
                          .join("")
                          .toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {[c.properties.firstname, c.properties.lastname]
                            .filter(Boolean)
                            .join(" ") || "—"}
                        </div>
                        {c.properties.jobtitle && (
                          <div className="text-zinc-400 text-xs flex items-center gap-1.5 mt-1">
                            <BriefcaseIcon className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                            <span className="truncate">{c.properties.jobtitle}</span>
                          </div>
                        )}
                        {c.properties.company && (
                          <div className="text-zinc-400 text-xs flex items-center gap-1.5 mt-1">
                            <BuildingOfficeIcon className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                            <span className="truncate">{c.properties.company}</span>
                          </div>
                        )}
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-zinc-600 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
      {!loading && query.trim() && companies.length === 0 && contacts.length === 0 && !error && (
        <p className="mt-6 text-zinc-500 text-center">
          No results. <Link href="/conventions" className="text-orange-500 underline">Check directory</Link> for convention leads.
        </p>
      )}
    </main>
  );
}
