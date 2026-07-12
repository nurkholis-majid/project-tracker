"use client";

import { useMemo, useState } from "react";
import { useTracker } from "@/lib/useTracker";
import { barGeom, computeKpi, csvOfStories, epicStats, fmt, recapText, semesterOf } from "@/lib/kpi";
import { labelOf } from "@/lib/types";
import {
  BAR_TONE, Badge, Btn, Card, ErrorBar, JiraLink, Label, Loading, Metric, Progress,
  Select, Td, Th, inputCls,
} from "@/components/ui";

export default function RecapPage() {
  const { data, loading, error } = useTracker();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [half, setHalf] = useState<1 | 2>(now.getMonth() < 6 ? 1 : 2);
  const [copied, setCopied] = useState(false);

  const sem = semesterOf(year, half);
  const kpi = useMemo(() => computeKpi(data, sem), [data, sem]);
  const stats = useMemo(() => epicStats(data), [data]);
  const text = useMemo(() => recapText(data, kpi), [data, kpi]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const downloadCsv = () => {
    const blob = new Blob([csvOfStories(data)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `project-tracker-s${half}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (loading) return <Loading />;

  const versionsOf = (epicId: string) =>
    Array.from(
      new Set(
        data.stories
          .filter((s) => s.epic_id === epicId && s.release_id)
          .map((s) => data.releases.find((r) => r.id === s.release_id)?.fix_version)
          .filter(Boolean)
      )
    ) as string[];

  return (
    <div className="space-y-6">
      <ErrorBar msg={error} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label>Periode penilaian</Label>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Semester {half} · {year}</h1>
          <p className="mt-1 font-mono text-xs text-mist-600">{fmt(sem.start)} — {fmt(sem.end)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            className="w-36"
            value={String(half)}
            onChange={(v) => setHalf(Number(v) as 1 | 2)}
            options={[
              { value: "1", label: "Semester 1" },
              { value: "2", label: "Semester 2" },
            ]}
          />
          <Select
            className="w-28"
            value={String(year)}
            onChange={(v) => setYear(Number(v))}
            options={[year - 2, year - 1, year, year + 1].map((y) => ({ value: String(y), label: String(y) }))}
          />
          <Btn onClick={downloadCsv}>⬇︎ CSV</Btn>
        </div>
      </header>

      {/* Yang dinilai manajer adalah project yang kelar, bukan jumlah story. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric v={kpi.epicsDone.length} k="Epic selesai" icon="🏆" accent />
        <Metric v={kpi.epicsRunning.length} k="Epic berjalan" icon="📦" />
        <Metric v={kpi.releases.length} k="Release ke production" icon="🚀" />
        <Metric v={`${kpi.pointsDone}`} k={`Story point · ${kpi.storiesDone.length} story`} icon="🔢" />
      </div>

      <section className="rounded-2xl border border-mist-200 bg-white shadow-card">
        <div className="border-b border-mist-100 px-5 py-4">
          <h2 className="text-base font-semibold">📦 Epic di semester ini</h2>
          <p className="mt-0.5 text-sm text-mist-600">
            Diurut dari start date. Bar-nya menunjukkan epic itu berjalan di bulan apa saja.
          </p>
        </div>

        <div className="px-5 py-4">
          <div className="hidden grid-cols-12 gap-2 pb-2 lg:grid">
            <div className="col-span-5" />
            <div className="col-span-7 grid grid-cols-6">
              {sem.months.map((m) => (
                <div key={m} className="text-center font-mono text-[10px] uppercase tracking-widest text-mist-400">
                  {m}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {kpi.epicsRunning.map((e) => {
              const g = barGeom(e, sem);
              const st = stats[e.id];
              const pct = st?.points ? Math.round((st.donePoints / st.points) * 100) : 0;
              const vers = versionsOf(e.id);
              return (
                <div key={e.id} className="grid grid-cols-1 items-center gap-2 lg:grid-cols-12">
                  <div className="min-w-0 lg:col-span-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium text-ink-900">{e.name}</span>
                      <Badge v={e.status} />
                      {vers.map((v) => (
                        <span key={v} className="rounded-full bg-ocean-100 px-2 py-0.5 font-mono text-[10px] text-ocean-600">
                          v{v}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="w-28"><Progress pct={pct} /></div>
                      <span className="font-mono text-[10px] text-mist-400">
                        {st?.donePoints ?? 0}/{st?.points ?? 0} pt · {pct}%
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-7">
                    <div className="relative h-7 rounded-lg bg-mist-100">
                      <div className="pointer-events-none absolute inset-0 grid grid-cols-6">
                        {sem.months.map((m, i) => (
                          <div key={m} className={i ? "border-l border-white" : ""} />
                        ))}
                      </div>
                      <div
                        title={`${labelOf(e.status)} · ${fmt(e.start_date)} – ${fmt(e.end_date)}`}
                        className={`absolute inset-y-1 rounded-md ${BAR_TONE[e.status] ?? "bg-mist-400"}`}
                        style={{ left: `${g.left}%`, width: `${g.width}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {kpi.epicsRunning.length === 0 && (
              <div className="py-10 text-center">
                <div className="text-2xl">🗓️</div>
                <p className="mt-2 text-sm text-mist-600">
                  Belum ada epic di periode ini. Isi start &amp; end date di menu Epic supaya masuk hitungan.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-mist-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-mist-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">📋 Rekap siap kirim</h2>
            <p className="mt-0.5 text-sm text-mist-600">Tinggal tempel ke email atau deck untuk manager.</p>
          </div>
          <Btn tone="accent" onClick={copy}>{copied ? "✓ Tersalin" : "Salin rekap"}</Btn>
        </div>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap px-5 py-4 font-mono text-xs leading-relaxed text-ink-700">
          {text}
        </pre>
      </section>
    </div>
  );
}
