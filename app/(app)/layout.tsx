"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NAV = [
  { href: "/", label: "Overview", hint: "Kondisi hari ini" },
  { href: "/recap", label: "Rekap Semester", hint: "KPI" },
  { href: "/epics", label: "Epic / Project", hint: "" },
  { href: "/stories", label: "Story", hint: "" },
  { href: "/releases", label: "Release & Dokumen", hint: "" },
  { href: "/flags", label: "Feature Flag", hint: "" },
  { href: "/sync", label: "Jira Sync", hint: "" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();

  const signOut = async () => {
    await supabase().auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="shrink-0 bg-slate-900 lg:flex lg:w-60 lg:flex-col">
        <div className="border-b border-slate-700 px-5 py-4">
          <div className="font-mono text-xs tracking-widest text-amber-400">SQUAD LSS</div>
          <div className="mt-0.5 text-lg font-semibold leading-tight text-white">Delivery Tracker</div>
        </div>

        <nav className="flex overflow-x-auto p-2 lg:flex-1 lg:flex-col">
          {NAV.map((n) => {
            const active = path === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex w-full items-center justify-between gap-3 whitespace-nowrap rounded px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <span>{n.label}</span>
                <span className="font-mono text-[10px] text-slate-500">{n.hint}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden border-t border-slate-800 p-2 lg:block">
          <button
            onClick={signOut}
            className="w-full rounded px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-800 hover:text-slate-200"
          >
            Keluar
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 lg:p-8">{children}</main>
    </div>
  );
}
