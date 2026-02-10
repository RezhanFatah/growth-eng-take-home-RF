"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const HUBSPOT_BASE = "https://api.hubapi.com";

type Contact = {
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

export default function CRMContactPage() {
  const params = useParams();
  const id = params.id as string;
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/hubspot/contacts/${id}`)
      .then((r) => {
        if (r.status === 404) throw new Error("not_found");
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setContact)
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

  if (error === "not_found" || !contact) {
    return (
      <main className="p-4 pb-20">
        <p className="text-zinc-400">No HubSpot record for this contact.</p>
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

  const name = [contact.properties.firstname, contact.properties.lastname]
    .filter(Boolean)
    .join(" ") || "—";

  return (
    <main className="p-4 pb-20">
      <Link href="/crm" className="text-orange-500 hover:underline text-sm inline-block mb-4">
        ← Back to CRM
      </Link>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-xl font-bold">
          {name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold">{name}</h1>
          {contact.properties.jobtitle && (
            <p className="text-zinc-400 text-sm">{contact.properties.jobtitle}</p>
          )}
        </div>
      </div>
      <div className="rounded-xl bg-zinc-800/80 border border-zinc-700/50 p-4 space-y-3">
        <Row label="Email" value={contact.properties.email} />
        <Row label="Phone" value={contact.properties.phone} />
        <Row label="Company" value={contact.properties.company} />
      </div>
      <div className="mt-4">
        <Link
          href="/conventions"
          className="text-orange-500 hover:underline text-sm"
        >
          Check directory →
        </Link>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-zinc-500 shrink-0">{label}:</span>
      <span className="break-words">{value ?? "—"}</span>
    </div>
  );
}
