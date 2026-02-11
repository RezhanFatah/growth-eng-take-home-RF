"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDaysIcon, UserGroupIcon, ChatBubbleLeftRightIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { CalendarDaysIcon as CalendarDaysSolid, UserGroupIcon as UserGroupSolid, ChatBubbleLeftRightIcon as ChatBubbleLeftRightSolid, DocumentTextIcon as DocumentTextSolid } from "@heroicons/react/24/solid";

const navItems = [
  { href: "/conventions", label: "Events", icon: CalendarDaysIcon, iconSolid: CalendarDaysSolid },
  { href: "/crm", label: "CRM", icon: UserGroupIcon, iconSolid: UserGroupSolid },
  { href: "/chat", label: "Chat", icon: ChatBubbleLeftRightIcon, iconSolid: ChatBubbleLeftRightSolid },
  { href: "/notes", label: "Notes", icon: DocumentTextIcon, iconSolid: DocumentTextSolid },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 safe-area-pb">
      <div className="flex justify-around items-center px-2 py-1">
        {navItems.map(({ href, label, icon: Icon, iconSolid: IconSolid }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const ActiveIcon = active ? IconSolid : Icon;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-2 px-6 rounded-xl transition-all ${
                active
                  ? "text-orange-500"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              <ActiveIcon className="w-6 h-6" />
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
