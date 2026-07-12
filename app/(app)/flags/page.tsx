"use client";

import { useState } from "react";
import { useTracker } from "@/lib/useTracker";
import type { Flag } from "@/lib/types";
import {
  Btn, Card, EmptyRow, ErrorBar, Field, FormActions, JiraLink, Loading,
  Modal, PageHead, RowActions, Td, Th, inputCls,
} from "@/components/ui";

/** TRUE → FALSE → belum dikonfigurasi (null) → TRUE … */
const cycle = (v: boolean | null) => (v === true ? false : v === false ? null : true);
const show = (v: boolean | null) => (v === true ? "TRUE" : v === false ? "FALSE" : "—");
const cellCls = (v: boolean | null) =>
  v === true
    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
    : v === false
    ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
    : "text-slate-300 hover:bg-slate-50";

const blank = (): Partial<Flag> => ({
  name: "", epic_id: null, description: "", dev: null, uat: null, prod: null, jira_key: "",
});

export default function FlagsPage() {
  const { data, loading, error, save, remove, patch } = useTracker();
  const [form, setForm] = useState<Partial<Flag> | null>(null);

  if (loading) return <Loading />;

  const submit = async () => {
    if (!form?.name) return;
    const row: Record<string, unknown> = { ...form };
    if (!row.epic_id) row.epic_id = null;
    if (!row.jira_key) row.jira_key = null;
    if (await save("feature_flags", row)) setForm(null);
  };

  return (
    <div className="space-y-4">
      <ErrorBar msg={error} />
      <PageHead
        title="Feature Flag"
        sub="Klik sel DEV / UAT / PROD untuk ganti nilai: TRUE → FALSE → belum dikonfigurasi."
      >
        <Btn tone="solid" onClick={() => setForm(blank())}>+ Flag</Btn>
      </PageHead>

      <Card>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th className="w-10">No</Th>
              <Th className="w-64">Feature flag</Th>
              <Th className="w-48">Epic</Th>
              <Th>Deskripsi</Th>
              <Th className="w-20 text-center">DEV</Th>
              <Th className="w-20 text-center">UAT</Th>
              <Th className="w-20 text-center">PROD</Th>
              <Th className="w-24">Jira</Th>
              <Th className="w-24" />
            </tr>
          </thead>
          <tbody>
            {data.flags.map((f, i) => (
              <tr key={f.id} className="hover:bg-slate-50">
                <Td className="font-mono text-xs text-slate-400">{i + 1}</Td>
                <Td className="font-mono text-xs font-medium text-slate-900">{f.name}</Td>
                <Td className="text-xs">{data.epics.find((e) => e.id === f.epic_id)?.name ?? "—"}</Td>
                <Td className="whitespace-pre-wrap text-xs text-slate-600">{f.description}</Td>
                {(["dev", "uat", "prod"] as const).map((env) => (
                  <td key={env} className="border-b border-slate-100 p-0 text-center">
                    <button
                      onClick={() => patch("feature_flags", f.id, { [env]: cycle(f[env]) })}
                      className={`h-full w-full px-3 py-2 font-mono text-xs ${cellCls(f[env])}`}
                    >
                      {show(f[env])}
                    </button>
                  </td>
                ))}
                <Td><JiraLink k={f.jira_key} /></Td>
                <Td>
                  <RowActions
                    onEdit={() => setForm(f)}
                    onDelete={() => confirm(`Hapus flag ${f.name}?`) && remove("feature_flags", f.id)}
                  />
                </Td>
              </tr>
            ))}
            {data.flags.length === 0 && (
              <EmptyRow cols={9} msg="Belum ada feature flag. Isi hanya untuk epic yang memang pakai flag." />
            )}
          </tbody>
        </table>
      </Card>

      {form && (
        <Modal title={form.id ? "Ubah feature flag" : "Feature flag baru"} onClose={() => setForm(null)}>
          <div className="space-y-4">
            <Field label="Nama flag">
              <input
                className={inputCls + " font-mono"}
                value={form.name ?? ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="FF_BE_V1_transferHybridMode"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Epic">
                <select
                  className={inputCls}
                  value={form.epic_id ?? ""}
                  onChange={(e) => setForm({ ...form, epic_id: e.target.value || null })}
                >
                  <option value="">— tanpa epic —</option>
                  {data.epics.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Jira key">
                <input
                  className={inputCls + " font-mono"}
                  value={form.jira_key ?? ""}
                  onChange={(e) => setForm({ ...form, jira_key: e.target.value.toUpperCase() })}
                  placeholder="DLB-8833"
                />
              </Field>
            </div>

            <Field label="Deskripsi">
              <textarea
                rows={4}
                className={inputCls}
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>

            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Konfigurasi per environment
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {([["dev", "DEV"], ["uat", "UAT"], ["prod", "PROD"]] as const).map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => setForm({ ...form, [k]: cycle(form[k] ?? null) })}
                    className={`rounded border px-3 py-2 font-mono text-xs ${
                      form[k] === true
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : form[k] === false
                        ? "border-rose-300 bg-rose-50 text-rose-700"
                        : "border-slate-200 bg-white text-slate-400"
                    }`}
                  >
                    {l}: {show(form[k] ?? null)}
                  </button>
                ))}
              </div>
            </div>

            <FormActions onClose={() => setForm(null)} onSave={submit} />
          </div>
        </Modal>
      )}
    </div>
  );
}
