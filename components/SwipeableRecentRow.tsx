"use client";

import { useRef, useState } from "react";
import Link from "next/link";

const DELETE_WIDTH = 60;

type RecentItem = {
  id: string;
  type: "company" | "contact" | "directory";
  name: string;
  snippet: string;
  date: string;
};

type Props = {
  item: RecentItem;
  href: string;
  onDelete: () => void;
};

export function SwipeableRecentRow({ item, href, onDelete }: Props) {
  const [translateX, setTranslateX] = useState(0);
  const touchStartX = useRef(0);
  const translateStart = useRef(0);

  const clamped = (v: number) => Math.max(-DELETE_WIDTH, Math.min(0, v));

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    translateStart.current = translateX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.targetTouches[0].clientX - touchStartX.current;
    setTranslateX(clamped(translateStart.current + dx));
  };

  const onTouchEnd = () => {
    setTranslateX((prev) => (prev < -DELETE_WIDTH / 2 ? -DELETE_WIDTH : 0));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    touchStartX.current = e.clientX;
    translateStart.current = translateX;
    const onMouseMove = (e2: MouseEvent) => setTranslateX(clamped(translateStart.current + e2.clientX - touchStartX.current));
    const onMouseUp = () => {
      setTranslateX((prev) => (prev < -DELETE_WIDTH / 2 ? -DELETE_WIDTH : 0));
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleDelete = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete();
  };

  return (
    <li className="relative overflow-hidden rounded-xl">
      <button
        type="button"
        onClick={handleDelete}
        className="absolute right-0 top-0 bottom-0 w-[60px] flex items-center justify-center bg-red-600 hover:bg-red-500"
        aria-label="Delete conversation"
      >
        <img src="/icons/trash.png" alt="" className="w-5 h-5 invert" aria-hidden />
      </button>
      <div
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
      >
        <Link
          href={href}
          className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/50 hover:bg-zinc-800 min-w-0"
        >
          <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-sm font-bold shrink-0">
            {item.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{item.name}</div>
            <div className="text-zinc-400 text-sm truncate">{item.snippet}</div>
          </div>
          <span className="text-zinc-500 text-xs shrink-0">
            {new Date(item.date).toLocaleDateString()}
          </span>
          <span className="text-zinc-500">›</span>
        </Link>
      </div>
    </li>
  );
}
