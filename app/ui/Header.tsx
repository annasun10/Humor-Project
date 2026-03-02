// app/ui/Header.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "./SignOutButton";

export default function Header() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* left */}
        <div className="relative" ref={ref}>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(o => !o)}
            className="p-2 rounded-md border hover:bg-slate-50"
          >
            {/* Hamburger icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* dropdown */}
          <div
            className={`absolute left-0 mt-2 w-56 rounded-md border bg-white shadow-lg z-50 transition ${
              open ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <nav className="p-2">
              <Link
                href="/vote"
                className={`block px-3 py-2 rounded hover:bg-slate-50 ${pathname === "/vote" ? "font-semibold" : ""}`}
              >
                Vote
              </Link>
              <Link
                href="/upload"
                className={`block px-3 py-2 rounded hover:bg-slate-50 ${pathname === "/upload" ? "font-semibold" : ""}`}
              >
                Upload
              </Link>

              <div className="border-t my-2" />
              <div className="px-3 py-2">
                <SignOutButton />
              </div>
            </nav>
          </div>
        </div>

        {/* center */}
        <Link href="/vote" className="text-lg font-medium">
          Humor Project
        </Link>

        {/* right spacer */}
        <div className="w-10" />
      </div>
    </header>
  );
}