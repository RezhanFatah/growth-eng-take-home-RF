"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/conventions", label: "Conventions", icon: "/icons/list.png" },
  { href: "/crm", label: "CRM", icon: "/icons/crm.png" },
  { href: "/chat", label: "Chat", icon: "/icons/chat.png" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--card)] border-t border-white/10 flex justify-around py-2 safe-area-pb">
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
            <img src={icon} alt="" className="w-6 h-6 object-contain" aria-hidden />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
