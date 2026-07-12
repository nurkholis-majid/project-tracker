"use client";

import { useMemo, useState } from "react";
import { useTracker } from "@/lib/useTracker";
import {
  barGeom,
  computeKpi,
  csvOfStories,
  epicStats,
  fmt,
  recapText,
  semesterOf,
} from "@/lib/kpi";
import { BAR_TONE, Btn, ErrorBar, Label, Loading, Metric, inputCls } from "@/components/ui";

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
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const downloadCsv = () => {
    const blob = new Blob([csvOfStories(data)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `lss-stories-s${half}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <ErrorBar msg={error} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label>Periode penilaian</Label>
          <h1 className="text-2xl font-semibold tracking-tight">{sem.label}</h1>
          <p className="mt-0.5 font-mono text-xs text-slate-500">
            {fmt(sem.start)} — {fmt(sem.end)}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={half}
            onChange={(e) => setHalf(Number(e.target.value) as 1 | 2)}
            className={inputCls + " w-32"}
          >
            <option value={1}>Semester 1</option>
            <option value={2}>Semester 2</option>
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className={inputCls + " w-24"}
          >
            {[year - 2, year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <Btn onClick={downloadCsv}>Export CSV</Btn>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric v={kpi.epicsRunning.length} k="Project berjalan" />
        <Metric v={kpi.epicsDone.length} k="Project selesai" accent />
        <Metric v={kpi.pointsDone} k="Story point delivered" accent />
        <Metric v={kpi.storiesDone.length} k="Story done" />
        <Metric v={kpi.releases.length} k="Release ke production" />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <Label>Peta project di semester ini</Label>
        </div>

        <div className="grid grid-cols-6 gap-px border-b border-slate-200 pb-1">
          {sem.months.map((m) => (
            <div key={m} className="text-center font-mono text-[10px] uppercase tracking-widest text-slate-400">
              {m}
            </div>
          ))}
        </div>

        <div className="mt-3 space-y-2">
          {kpi.epicsRunning.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">
              Belum ada project di periode ini. Isi start &amp; end date di menu Epic supaya masuk hitungan.
            </p>
          )}
          {kpi.epicsRunning.map((e) => {
            const g = barGeom(e, sem);
            const st = stats[e.id];
            return (
              <div key={e.id} className="grid grid-cols-1 items-center gap-1 lg:grid-cols-12">
                <div className="truncate text-sm lg:col-span-4">
                  <span className="font-medium">{e.name}</span>{" "}
                  <span className="font-mono text-xs text-slate-400">
                    {st?.donePoints ?? 0}/{st?.points ?? 0} pt
                  </span>
                </div>
                <div className="relative h-6 rounded bg-slate-100 lg:col-span-8">
                  <div className="pointer-events-none absolute inset-0 grid grid-cols-6">
                    {sem.months.map((m, i) => (
                      <div key={m} className={i ? "border-l border-white" : ""} />
                    ))}
                  </div>
                  <div
                    title={`${e.status} · ${fmt(e.start_date)} – ${fmt(e.end_date)}`}
                    className={`absolute inset-y-1 rounded ${BAR_TONE[e.status] ?? "bg-slate-400"}`}
                    style={{ left: `${g.left}%`, width: `${g.width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-3">
          <Label>Teks rekap — tinggal tempel ke email atau deck manager</Label>
          <Btn tone="accent" onClick={copy}>
            {copied ? "Tersalin" : "Salin rekap"}
          </Btn>
        </div>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap px-5 py-4 font-mono text-xs leading-relaxed text-slate-700">
          {text}
        </pre>
      </section>
    </div>
  );
}
