"use client";

import { useState } from "react";
import { useTracker } from "@/lib/useTracker";
import { fmt, num } from "@/lib/kpi";
import { DOC_TYPES, type DocType, type Release } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import {
  Btn, ErrorBar, Field, FormActions, Label, Loading, Modal, PageHead, RowActions, inputCls,
} from "@/components/ui";

const blank = (): Partial<Release> => ({ fix_version: "", deploy_date: null, folder_url: "", notes: "" });

export default function ReleasesPage() {
  const { data, loading, error, setError, save, remove, reload } = useTracker();
  const [form, setForm] = useState<Partial<Release> | null>(null);
  const [docs, setDocs] = useState<Record<DocType, string>>({} as Record<DocType, string>);

  if (loading) return <Loading />;

  const openForm = (r?: Release) => {
    const d = {} as Record<DocType, string>;
    DOC_TYPES.forEach((t) => {
      d[t] = r ? data.docs.find((x) => x.release_id === r.id && x.doc_type === t)?.url ?? "" : "";
    });
    setDocs(d);
    setForm(r ?? blank());
  };

  const submit = async () => {
    if (!form?.fix_version) return;
    const row: Record<string, unknown> = { ...form };
    if (!row.deploy_date) row.deploy_date = null;

    const sb = supabase();
    let releaseId = form.id;

    if (releaseId) {
      const { error } = await sb.from("releases").update(row).eq("id", releaseId);
      if (error) return setError("Gagal menyimpan release: " + error.message);
    } else {
      const { data: created, error } = await sb.from("releases").insert(row).select("id").single();
      if (error || !created) return setError("Gagal menyimpan release: " + (error?.message ?? ""));
      releaseId = created.id;
    }

    // URL dokumen disimpan per tipe; 1 fix version = 1 baris per dokumen.
    const rows = DOC_TYPES.filter((t) => docs[t]?.trim()).map((t) => ({
      release_id: releaseId,
      doc_type: t,
      url: docs[t].trim(),
    }));
    const emptyTypes = DOC_TYPES.filter((t) => !docs[t]?.trim());

    if (rows.length) {
      const { error } = await sb.from("release_documents").upsert(rows, { onConflict: "release_id,doc_type" });
      if (error) return setError("Gagal menyimpan dokumen: " + error.message);
    }
    if (emptyTypes.length) {
      await sb.from("release_documents").delete().eq("release_id", releaseId).in("doc_type", emptyTypes);
    }

    setForm(null);
    await reload();
  };

  return (
    <div className="space-y-4">
      <ErrorBar msg={error} />
      <PageHead
        title="Release &amp; Dokumen"
        sub="1 fix version = 1 folder SharePoint. Epic yang ikut di dalamnya terisi otomatis dari story."
      >
        <Btn tone="solid" onClick={() => openForm()}>+ Fix version</Btn>
      </PageHead>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.releases.map((r) => {
          const stories = data.stories.filter((s) => s.release_id === r.id);
          const epics = Array.from(new Set(stories.map((s) => s.epic_id)))
            .map((id) => data.epics.find((e) => e.id === id))
            .filter(Boolean);
          const pts = stories.reduce((a, s) => a + num(s.story_points), 0);

          return (
            <div key={r.id} className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-start justify-between border-b border-slate-200 px-5 py-3">
                <div>
                  <div className="font-mono text-lg font-semibold">v{r.fix_version}</div>
                  <div className="mt-0.5 font-mono text-xs text-slate-500">
                    Deploy {fmt(r.deploy_date)} · {stories.length} story · {pts} pt
                  </div>
                </div>
                <RowActions
                  onEdit={() => openForm(r)}
                  onDelete={() => confirm(`Hapus release v${r.fix_version}?`) && remove("releases", r.id)}
                />
              </div>

              <div className="space-y-3 px-5 py-4">
                <div>
                  <Label>Epic di release ini</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {epics.length ? (
                      epics.map((e) => (
                        <span key={e!.id} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                          {e!.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">
                        Belum ada story yang di-assign ke fix version ini.
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Folder dokumen</Label>
                  {r.folder_url ? (
                    <a
                      href={r.folder_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-xs text-sky-700 underline underline-offset-2"
                    >
                      {r.folder_url}
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">Belum ada URL folder SharePoint.</span>
                  )}
                </div>

                <div>
                  <Label>Checklist dokumen</Label>
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    {DOC_TYPES.map((t) => {
                      const url = data.docs.find((d) => d.release_id === r.id && d.doc_type === t)?.url;
                      return url ? (
                        <a
                          key={t}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-800 hover:bg-emerald-100"
                        >
                          <span className="font-mono">✓</span>
                          {t}
                        </a>
                      ) : (
                        <span
                          key={t}
                          className="flex items-center gap-2 rounded bg-slate-50 px-2 py-1 text-xs text-slate-400"
                        >
                          <span className="font-mono">○</span>
                          {t}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {data.releases.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
            Belum ada fix version. Tambahkan satu, lalu assign story-nya dari menu Story.
          </div>
        )}
      </div>

      {form && (
        <Modal title={form.id ? "Ubah fix version" : "Fix version baru"} onClose={() => setForm(null)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fix version">
                <input
                  className={inputCls + " font-mono"}
                  value={form.fix_version ?? ""}
                  onChange={(e) => setForm({ ...form, fix_version: e.target.value })}
                  placeholder="1.13.0"
                />
              </Field>
              <Field label="Tanggal deploy">
                <input
                  type="date"
                  className={inputCls}
                  value={form.deploy_date ?? ""}
                  onChange={(e) => setForm({ ...form, deploy_date: e.target.value })}
                />
              </Field>
            </div>

            <Field label="URL folder SharePoint">
              <input
                className={inputCls}
                value={form.folder_url ?? ""}
                onChange={(e) => setForm({ ...form, folder_url: e.target.value })}
                placeholder="https://…/00. Done Deploy/1.13.0"
              />
            </Field>

            <div>
              <Label>URL dokumen deployment</Label>
              <div className="mt-2 space-y-2">
                {DOC_TYPES.map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <span className="w-28 shrink-0 font-mono text-xs text-slate-500">{t}</span>
                    <input
                      className={inputCls}
                      value={docs[t] ?? ""}
                      onChange={(e) => setDocs({ ...docs, [t]: e.target.value })}
                      placeholder="https://sharepoint…"
                    />
                  </div>
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
