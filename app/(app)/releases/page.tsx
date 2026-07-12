"use client";

import { useState } from "react";
import { useTracker } from "@/lib/useTracker";
import { fmt, num } from "@/lib/kpi";
import { DEPLOY_STATUS, type Release } from "@/lib/types";
import {
  Badge, Btn, ErrorBar, Field, FormActions, JiraLink, Label, Loading, Modal, PageHead,
  RowActions, Select, StatusSelect, inputCls, optionsOf,
} from "@/components/ui";

const blank = (): Partial<Release> => ({
  fix_version: "", deploy_date: null, folder_url: "", status: "Planned", notes: "",
});

export default function ReleasesPage() {
  const { data, loading, error, save, remove, patch } = useTracker();
  const [form, setForm] = useState<Partial<Release> | null>(null);
  const [filter, setFilter] = useState("all");

  if (loading) return <Loading />;

  const rows = data.releases.filter((r) => filter === "all" || r.status === filter);

  const submit = async () => {
    if (!form?.fix_version) return;
    const row: Record<string, unknown> = { ...form };
    if (!row.deploy_date) row.deploy_date = null;
    if (await save("releases", row)) setForm(null);
  };

  return (
    <div>
      <PageHead
        title="Release"
        sub="Satu fix version, satu URL folder SharePoint. Daftar story di bawahnya terisi otomatis dari yang di-assign ke versi ini."
      >
        <Select
          w="w-48"
          value={filter}
          onChange={setFilter}
          options={[{ value: "all", label: "Semua release" }, ...optionsOf(DEPLOY_STATUS)]}
        />
        <Btn tone="accent" onClick={() => setForm(blank())}>+ Fix version</Btn>
      </PageHead>

      <ErrorBar msg={error} />

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((r) => {
          const stories = data.stories.filter((s) => s.release_id === r.id);
          const pts = stories.reduce((a, s) => a + num(s.story_points), 0);
          const deployed = stories.filter((s) => s.release_status === "Deployed").length;

          return (
            <div key={r.id} className="flex flex-col rounded-2xl border border-mist-200 bg-white shadow-card">
              <div className="flex items-start justify-between gap-3 border-b border-mist-100 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xl font-semibold">v{r.fix_version}</span>
                    <StatusSelect
                      value={r.status}
                      options={DEPLOY_STATUS}
                      onChange={(v) => patch("releases", r.id, { status: v })}
                    />
                  </div>
                  <div className="mt-1 font-mono text-xs text-mist-600">
                    {r.deploy_date ? `${r.status === "Deployed" ? "Deployed" : "Rencana"} ${fmt(r.deploy_date)}` : "Tanggal deploy belum diisi"}
                    {" · "}{stories.length} story · {pts} pt
                  </div>
                </div>
                <RowActions
                  onEdit={() => setForm(r)}
                  onDelete={() => confirm(`Hapus release v${r.fix_version}?`) && remove("releases", r.id)}
                />
              </div>

              <div className="space-y-4 px-5 py-4">
                <div>
                  <Label>Folder dokumen (TAT, QCR, DR, dll.)</Label>
                  {r.folder_url ? (
                    <a href={r.folder_url} target="_blank" rel="noreferrer"
                      className="mt-1 block truncate text-xs text-ocean-600 underline underline-offset-2">
                      🔗 {r.folder_url}
                    </a>
                  ) : (
                    <p className="mt-1 text-xs text-sun-600">⚠️ URL folder SharePoint belum diisi</p>
                  )}
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <Label>Story di release ini</Label>
                    <span className="font-mono text-[10px] text-mist-400">{deployed}/{stories.length} deployed</span>
                  </div>

                  <div className="max-h-56 overflow-y-auto rounded-xl border border-mist-100">
                    {stories.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 border-b border-mist-100 px-3 py-2 last:border-0">
                        <span className="min-w-0 flex-1 truncate text-xs text-ink-700">{s.title}</span>
                        <JiraLink k={s.jira_key} />
                        <Badge v={s.release_status} />
                      </div>
                    ))}
                    {stories.length === 0 && (
                      <p className="px-3 py-6 text-center text-xs text-mist-400">
                        Belum ada story. Assign dari menu Need to Deploy.
                      </p>
                    )}
                  </div>
                </div>

                {r.notes && <p className="rounded-xl bg-mist-50 px-3 py-2 text-xs text-ink-700">📌 {r.notes}</p>}
              </div>
            </div>
          );
        })}

        {rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-mist-200 bg-white p-10 text-center lg:col-span-2">
            <div className="text-3xl">🚀</div>
            <p className="mt-2 text-sm text-mist-600">Belum ada fix version di filter ini.</p>
          </div>
        )}
      </div>

      {form && (
        <Modal
          title={form.id ? `Ubah release v${form.fix_version}` : "Fix version baru"}
          subtitle="Dokumen tetap di SharePoint — di sini cukup satu URL folder-nya."
          onClose={() => setForm(null)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Fix version">
                <input className={inputCls + " font-mono"} value={form.fix_version ?? ""}
                  onChange={(e) => setForm({ ...form, fix_version: e.target.value })} placeholder="1.13.0" />
              </Field>
              <Field label="Tanggal deploy">
                <input type="date" className={inputCls} value={form.deploy_date ?? ""}
                  onChange={(e) => setForm({ ...form, deploy_date: e.target.value })} />
              </Field>
              <Field label="Status">
                <Select full value={form.status ?? "Planned"}
                  onChange={(v) => setForm({ ...form, status: v as Release["status"] })} options={optionsOf(DEPLOY_STATUS)} />
              </Field>
            </div>

            <Field label="URL folder SharePoint" hint="Satu folder berisi semua dokumen deployment versi ini.">
              <input className={inputCls} value={form.folder_url ?? ""}
                onChange={(e) => setForm({ ...form, folder_url: e.target.value })}
                placeholder="https://…/00. Done Deploy/1.13.0" />
            </Field>

            <Field label="Notes">
              <textarea rows={3} className={inputCls} value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>

            <FormActions onClose={() => setForm(null)} onSave={submit} />
          </div>
        </Modal>
      )}
    </div>
  );
}
