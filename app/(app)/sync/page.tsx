"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { SyncRun } from "@/lib/types";
import { Btn, Card, EmptyRow, ErrorBar, Field, Label, PageHead, Td, Th, inputCls } from "@/components/ui";

export default function SyncPage() {
  const sb = useMemo(() => supabase(), []);
  const [jql, setJql] = useState("");
  const [overwrite, setOverwrite] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [runs, setRuns] = useState<SyncRun[]>([]);

  const loadRuns = async () => {
    const { data } = await sb.from("sync_runs").select("*").order("ran_at", { ascending: false }).limit(10);
    setRuns((data ?? []) as SyncRun[]);
  };

  useEffect(() => {
    loadRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async () => {
    setBusy(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/jira/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jql: jql.trim() || undefined, overwriteProgress: overwrite }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Sync gagal.");
      else setResult(`Selesai: ${json.epics} epic dan ${json.stories} story diperbarui dari ${json.total} issue.`);
    } catch (e: any) {
      setError("Sync gagal: " + e.message);
    }
    setBusy(false);
    loadRuns();
  };

  return (
    <div className="max-w-3xl space-y-6">
      <ErrorBar msg={error} />
      <PageHead
        title="Jira Sync"
        sub="Tarik epic & story dari Jira (read-only). Tidak butuh akses admin — cukup API token pribadi."
      />

      <Card>
        <div className="space-y-4 p-5">
          <Field label="JQL (kosongkan untuk pakai default dari environment)">
            <input
              className={inputCls + " font-mono"}
              value={jql}
              onChange={(e) => setJql(e.target.value)}
              placeholder='project = DLB AND Sprint in (64, 65) ORDER BY updated DESC'
            />
          </Field>

          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Timpa progress dari status Jira
              <span className="block text-xs text-slate-500">
                Done di Jira → Done di sini. Matikan kalau progress mau lu atur manual.
              </span>
            </span>
          </label>

          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <div className="font-semibold text-slate-700">Yang tidak akan tertimpa oleh sync:</div>
            task list (grup), fix version, status release, catatan epic, tanggal &amp; status epic, dan feature flag.
            Itu semua kolom lu sendiri — Jira nggak punya datanya.
          </div>

          <div className="flex items-center gap-3">
            <Btn tone="accent" onClick={run} disabled={busy}>
              {busy ? "Menarik dari Jira…" : "Tarik dari Jira"}
            </Btn>
            {result && <span className="text-sm text-emerald-700">{result}</span>}
          </div>
        </div>
      </Card>

      <section>
        <Label>Riwayat sync</Label>
        <div className="mt-2">
          <Card>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th className="w-44">Waktu</Th>
                  <Th>JQL</Th>
                  <Th className="w-20 text-right">Epic</Th>
                  <Th className="w-20 text-right">Story</Th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id}>
                    <Td className="font-mono text-xs">{new Date(r.ran_at).toLocaleString("id-ID")}</Td>
                    <Td className="font-mono text-xs text-slate-500">{r.jql}</Td>
                    <Td className="text-right font-mono text-xs">{r.epics_upsert}</Td>
                    <Td className="text-right font-mono text-xs">{r.stories_upsert}</Td>
                  </tr>
                ))}
                {runs.length === 0 && <EmptyRow cols={4} msg="Belum pernah sync." />}
              </tbody>
            </table>
          </Card>
        </div>
      </section>
    </div>
  );
}
