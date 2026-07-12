"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NAV = [
  { href: "/",          icon: "🏠", label: "Overview" },
  { href: "/recap",     icon: "🏆", label: "Rekap Semester" },
  { href: "/epics",     icon: "📦", label: "Epic" },
  { href: "/stories",   icon: "📝", label: "Story" },
  { href: "/releases",  icon: "🚀", label: "Release & Dokumen" },
  { href: "/flags",     icon: "🚩", label: "Feature Flag" },
  { href: "/sync",      icon: "🔄", label: "Jira Sync" },
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
    <div className="min-h-screen lg:flex">
      {/* Di layar kecil ini jadi header yang menempel di atas; di desktop jadi sidebar penuh.
          Tombol Keluar ikut pindah ke header supaya tidak perlu scroll untuk menemukannya. */}
      <aside className="sticky top-0 z-30 bg-ink-900 lg:h-screen lg:w-60 lg:shrink-0 lg:flex lg:flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:block lg:px-5 lg:py-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-sun-500 text-sm">📊</span>
            <span className="text-base font-semibold leading-tight text-white">Project Tracker</span>
          </Link>
          <button
            onClick={signOut}
            className="rounded-lg px-3 py-1.5 text-xs text-sky-400 hover:bg-ink-800 hover:text-white lg:hidden"
          >
            Keluar
          </button>
        </div>

        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-3">
          {NAV.map((n) => {
            const active = path === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-white/10 font-medium text-white"
                    : "text-sky-200/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-base">{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden border-t border-white/10 p-3 lg:block">
          <button
            onClick={signOut}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-sky-200/70 hover:bg-white/5 hover:text-white"
          >
            ↩︎ Keluar
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 lg:p-8">{children}</main>
    </div>
  );
}
