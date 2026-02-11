import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-center text-lg font-medium text-zinc-200 mb-2">Trade Show Prospecting</h1>
      <p className="text-center text-zinc-400 mb-6 text-center">
        Get context on companies and contacts at conventions.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/conventions"
          className="bg-orange-500 text-white text-center py-3 px-4 rounded-lg font-medium hover:bg-orange-600"
        >
          Browse conventions
        </Link>
        <Link
          href="/crm"
          className="bg-zinc-800 text-white text-center py-3 px-4 rounded-lg font-medium hover:bg-zinc-700"
        >
          Search CRM
        </Link>
        <Link
          href="/chat"
          className="bg-zinc-800 text-white text-center py-3 px-4 rounded-lg font-medium hover:bg-zinc-700"
        >
          Chat
        </Link>
      </div>
    </main>
  );
}
