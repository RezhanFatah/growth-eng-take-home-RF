"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import EngagementsSection from "@/components/EngagementsSection";

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
  associations?: {
    companies?: {
      results?: Array<{ toObjectId: string }>;
    };
  };
};

export default function CRMContactPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const companyId = searchParams.get("companyId"); // Check if coming from a company page
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/hubspot/contacts/${id}?associations=companies`)
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

  // Determine the back link - prioritize companyId from URL, then from contact associations
  const primaryCompanyId = companyId || contact.associations?.companies?.results?.[0]?.toObjectId;

  console.log("Debug back button:", {
    companyIdFromUrl: companyId,
    associations: contact.associations,
    primaryCompanyId,
  });

  const backHref = primaryCompanyId ? `/crm/company/${primaryCompanyId}` : "/crm";
  const backText = primaryCompanyId ? "← Back to Company" : "← Back to CRM";

  return (
    <main className="p-4 pb-20 relative">
      <Link href={backHref} className="text-orange-500 hover:underline text-sm inline-block mb-4">
        {backText}
      </Link>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-xl font-bold">
          {name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-center text-lg font-medium text-zinc-200">{name}</h1>
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
      <EngagementsSection
        engagementsUrl={`/api/hubspot/contacts/${id}/engagements`}
        title="Recent activity"
      />
      <div className="mt-4">
        <Link
          href="/conventions"
          className="text-orange-500 hover:underline text-sm"
        >
          Check directory →
        </Link>
      </div>

      {/* Floating AI Chat Button */}
      <Link
        href={`/chat/thread?type=contact&id=${id}`}
        className="fixed bottom-24 right-6 w-14 h-14 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 hover:bg-orange-600 hover:scale-110 transition-all active:scale-95 z-10"
        aria-label="Ask AI about this contact"
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6" />
      </Link>
    </main>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  const isEmail = label === "Email" && value;
  const isPhone = label === "Phone" && value;

  return (
    <div className="flex gap-2">
      <span className="text-zinc-500 shrink-0">{label}:</span>
      {isEmail ? (
        <a
          href={`mailto:${value}`}
          className="break-words text-orange-500 hover:underline"
        >
          {value}
        </a>
      ) : isPhone ? (
        <a
          href={`tel:${value}`}
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
