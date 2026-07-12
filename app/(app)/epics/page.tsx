"use client";

import { useState } from "react";
import { useTracker } from "@/lib/useTracker";
import { epicStats, fmt } from "@/lib/kpi";
import { EPIC_STATUS, type Epic } from "@/lib/types";
import {
  Badge, Btn, Card, EmptyRow, ErrorBar, Field, FormActions, JiraLink, Loading,
  Modal, PageHead, RowActions, Td, Th, inputCls,
} from "@/components/ui";

const blank = (): Partial<Epic> => ({
  name: "", jira_key: "", status: "Requirement",
  start_date: null, end_date: null, est_deploy: null, notes: "",
});

export default function EpicsPage() {
  const { data, loading, error, save, remove } = useTracker();
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState<Partial<Epic> | null>(null);

  if (loading) return <Loading />;

  const stats = epicStats(data);
  const rows = data.epics.filter((e) => filter === "all" || e.status === filter);

  const submit = async () => {
    if (!form?.name) return;
    const row = { ...form };
    // Kolom kosong dikirim sebagai null, bukan string kosong (biar tipe date valid di Postgres).
    (["start_date", "end_date", "est_deploy", "jira_key"] as const).forEach((k) => {
      if (!row[k]) row[k] = null;
    });
    if (await save("epics", row as Record<string, unknown>)) setForm(null);
  };

  return (
    <div className="space-y-4">
      <ErrorBar msg={error} />
      <PageHead
        title="Epic / Project"
        sub="1 epic = 1 project. Jumlah story dan story point dihitung otomatis dari menu Story."
      >
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className={inputCls + " w-44"}>
          <option value="all">Semua status</option>
          {EPIC_STATUS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <Btn tone="solid" onClick={() => setForm(blank())}>
          + Epic
        </Btn>
      </PageHead>

      <Card>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th className="w-10">No</Th>
              <Th>Epic</Th>
              <Th className="w-24">Jira</Th>
              <Th className="w-20 text-right">Story</Th>
              <Th className="w-24 text-right">Point</Th>
              <Th className="w-28">Progress</Th>
              <Th className="w-32">Status</Th>
              <Th className="w-28">Start</Th>
              <Th className="w-28">End</Th>
              <Th className="w-32">Est. deploy</Th>
              <Th>Catatan</Th>
              <Th className="w-24" />
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => {
              const st = stats[e.id] ?? { total: 0, points: 0, done: 0, donePoints: 0 };
              const pct = st.points ? Math.round((st.donePoints / st.points) * 100) : 0;
              return (
                <tr key={e.id} className="hover:bg-slate-50">
                  <Td className="font-mono text-xs text-slate-400">{i + 1}</Td>
                  <Td className="font-medium text-slate-900">{e.name}</Td>
                  <Td><JiraLink k={e.jira_key} /></Td>
                  <Td className="text-right font-mono text-xs">{st.done}/{st.total}</Td>
                  <Td className="text-right font-mono text-xs">{st.donePoints}/{st.points}</Td>
                  <Td>
                    <div className="h-1.5 w-full rounded bg-slate-100">
                      <div className="h-1.5 rounded bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-slate-400">{pct}%</div>
                  </Td>
                  <Td><Badge v={e.status} /></Td>
                  <Td className="font-mono text-xs">{fmt(e.start_date)}</Td>
                  <Td className="font-mono text-xs">{fmt(e.end_date)}</Td>
                  <Td className="font-mono text-xs">{fmt(e.est_deploy)}</Td>
                  <Td className="whitespace-pre-wrap text-xs text-slate-500">{e.notes}</Td>
                  <Td>
                    <RowActions
                      onEdit={() => setForm(e)}
                      onDelete={() => {
                        if (confirm(`Hapus epic "${e.name}"? Story-nya tidak ikut terhapus, hanya lepas dari epic ini.`))
                          remove("epics", e.id);
                      }}
                    />
                  </Td>
                </tr>
              );
            })}
            {rows.length === 0 && <EmptyRow cols={12} msg="Belum ada epic. Mulai dari tombol + Epic." />}
          </tbody>
        </table>
      </Card>

      {form && (
        <Modal title={form.id ? "Ubah epic" : "Epic baru"} onClose={() => setForm(null)}>
          <div className="space-y-4">
            <Field label="Nama epic">
              <input
                className={inputCls}
                value={form.name ?? ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="New Cust - Appraisal Web : Base Feature"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Jira key">
                <input
                  className={inputCls + " font-mono"}
                  value={form.jira_key ?? ""}
                  onChange={(e) => setForm({ ...form, jira_key: e.target.value.toUpperCase() })}
                  placeholder="DLB-13753"
                />
              </Field>
              <Field label="Status">
                <select
                  className={inputCls}
                  value={form.status ?? "Requirement"}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Epic["status"] })}
                >
                  {EPIC_STATUS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Start date">
                <input type="date" className={inputCls} value={form.start_date ?? ""}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </Field>
              <Field label="End date">
                <input type="date" className={inputCls} value={form.end_date ?? ""}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </Field>
              <Field label="Estimasi deploy">
                <input type="date" className={inputCls} value={form.est_deploy ?? ""}
                  onChange={(e) => setForm({ ...form, est_deploy: e.target.value })} />
              </Field>
            </div>
            <Field label="Catatan">
              <textarea
                rows={3}
                className={inputCls}
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder='21 Jan: nama menu jadi "Customer Claim"'
              />
            </Field>
            <FormActions onClose={() => setForm(null)} onSave={submit} />
          </div>
        </Modal>
      )}
    </div>
  );
}
