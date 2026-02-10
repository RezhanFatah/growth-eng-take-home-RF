"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/conventions", label: "Conventions", icon: "📋" },
  { href: "/crm", label: "CRM", icon: "👥" },
  { href: "/chat", label: "Chat", icon: "💬" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-[480px] bg-[var(--card)] border-t border-white/10 flex justify-around py-2 safe-area-pb">
      {navItems.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-lg transition-colors ${
              active ? "text-orange-500" : "text-zinc-400"
            }`}
          >
            <span className="text-lg" aria-hidden>{icon}</span>
            <span className="text-xs font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
