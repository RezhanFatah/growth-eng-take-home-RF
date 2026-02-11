"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import EngagementsSection from "@/components/EngagementsSection";

type Company = {
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

type Contact = {
  id: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  jobtitle?: string;
  phone?: string;
};

export default function CRMCompanyPage() {
  const params = useParams();
  const id = params.id as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/hubspot/companies/${id}`)
      .then((r) => {
        if (r.status === 404) throw new Error("not_found");
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => {
        setCompany(data.company);
        setContacts(data.contacts ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="p-4">
        <div className="text-zinc-500">Loading…</div>
      </main>
    );
  }

  if (error === "not_found" || !company) {
    return (
      <main className="p-4 pb-20">
        <p className="text-zinc-400">No HubSpot record for this company.</p>
        <Link
          href="/conventions"
          className="mt-4 inline-block bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600"
        >
          Check directory
        </Link>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-4">
        <p className="text-red-400">{error}</p>
        <Link href="/conventions" className="text-orange-500 underline mt-2 inline-block">
          Check directory
        </Link>
      </main>
    );
  }

  const name = company.properties.name ?? "—";

  return (
    <main className="p-4 pb-20 relative">
      <Link href="/crm" className="text-orange-500 hover:underline text-sm inline-block mb-4">
        ← Back to CRM
      </Link>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-xl font-bold">
          {name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-center text-lg font-medium text-zinc-200">{name}</h1>
          {company.properties.lifecyclestage && (
            <p className="text-zinc-400 text-sm">{company.properties.lifecyclestage}</p>
          )}
        </div>
      </div>
      <div className="rounded-xl bg-zinc-800/80 border border-zinc-700/50 p-4 space-y-3">
        <Row label="Company" value={company.properties.name} />
        <Row label="Domain" value={company.properties.domain} />
        <Row label="Website" value={company.properties.website} />
        <Row label="Industry" value={company.properties.industry} />
        <Row label="Revenue" value={company.properties.annualrevenue} />
        <Row label="Lifecycle" value={company.properties.lifecyclestage} />
      </div>
      {contacts.length > 0 && (
        <div className="mt-4 rounded-xl bg-zinc-800/80 border border-zinc-700/50 p-4">
          <h2 className="text-center text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Contacts we&apos;ve spoken to ({contacts.length})
          </h2>
          <ul className="space-y-2">
            {contacts.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/crm/contact/${c.id}?companyId=${id}`}
                  className="block p-2 rounded-lg hover:bg-zinc-700/50"
                >
                  <span className="font-medium">
                    {[c.firstname, c.lastname].filter(Boolean).join(" ")}
                  </span>
                  {c.jobtitle && (
                    <span className="text-zinc-400 text-sm ml-2">{c.jobtitle}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <EngagementsSection
        engagementsUrl={`/api/hubspot/companies/${id}/engagements`}
        title="Recent activity"
      />
      <div className="mt-4">
        <Link
          href="/conventions"
          className="text-orange-500 hover:underline text-sm"
        >
          Check directory for convention leads →
        </Link>
      </div>

      {/* Floating AI Chat Button */}
      <Link
        href={`/chat/thread?type=company&id=${id}`}
        className="fixed bottom-24 right-6 w-14 h-14 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 hover:bg-orange-600 hover:scale-110 transition-all active:scale-95 z-10"
        aria-label="Ask AI about this company"
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6" />
      </Link>
    </main>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  const isWebsite = label === "Website" || label === "Domain";
  const url = value && isWebsite ? (value.startsWith("http") ? value : `https://${value}`) : null;

  return (
    <div className="flex gap-2">
      <span className="text-zinc-500 shrink-0">{label}:</span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="break-words text-orange-500 hover:underline"
        >
          {value}
        </a>
      ) : (
        <span className="break-words">{value ?? "—"}</span>
      )}
    </div>
  );
}
