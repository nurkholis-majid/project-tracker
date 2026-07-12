"use client";

import { useState } from "react";
import { useTracker } from "@/lib/useTracker";
import { fmt, num } from "@/lib/kpi";
import { DOC_TYPES, type DocType, type Release } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import {
  Btn, ErrorBar, Field, FormActions, Label, Loading, Modal, PageHead, Progress, RowActions, inputCls,
} from "@/components/ui";

const blank = (): Partial<Release> => ({ fix_version: "", deploy_date: null, folder_url: "", notes: "" });

export default function ReleasesPage() {
  const { data, loading, error, setError, remove, reload } = useTracker();
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
      if (error) return setError("Release gagal disimpan: " + error.message);
    } else {
      const { data: created, error } = await sb.from("releases").insert(row).select("id").single();
      if (error || !created) return setError("Release gagal disimpan: " + (error?.message ?? ""));
      releaseId = created.id;
    }

    const rows = DOC_TYPES.filter((t) => docs[t]?.trim()).map((t) => ({
      release_id: releaseId, doc_type: t, url: docs[t].trim(),
    }));
    const emptyTypes = DOC_TYPES.filter((t) => !docs[t]?.trim());

    if (rows.length) {
      const { error } = await sb.from("release_documents").upsert(rows, { onConflict: "release_id,doc_type" });
      if (error) return setError("URL dokumen gagal disimpan: " + error.message);
    }
    if (emptyTypes.length) {
      await sb.from("release_documents").delete().eq("release_id", releaseId).in("doc_type", emptyTypes);
    }

    setForm(null);
    await reload();
  };

  return (
    <div className="space-y-5">
      <ErrorBar msg={error} />

      <PageHead
        title="Release & Dokumen"
        sub="Setiap fix version punya satu folder SharePoint. Daftar epic di dalamnya terisi otomatis dari story yang di-assign ke versi tersebut."
      >
        <Btn tone="accent" onClick={() => openForm()}>+ Fix version</Btn>
      </PageHead>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.releases.map((r) => {
          const stories = data.stories.filter((s) => s.release_id === r.id);
          const epics = Array.from(new Set(stories.map((s) => s.epic_id)))
            .map((id) => data.epics.find((e) => e.id === id))
            .filter(Boolean);
          const pts = stories.reduce((a, s) => a + num(s.story_points), 0);
          const filled = DOC_TYPES.filter(
            (t) => t !== "Lainnya" && data.docs.find((d) => d.release_id === r.id && d.doc_type === t && d.url)
          ).length;
          const need = DOC_TYPES.length - 1;

          return (
            <div key={r.id} className="rounded-2xl border border-mist-200 bg-white shadow-card">
              <div className="flex items-start justify-between border-b border-mist-100 px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚀</span>
                    <span className="font-mono text-xl font-semibold">v{r.fix_version}</span>
                  </div>
                  <div className="mt-1 font-mono text-xs text-mist-600">
                    {r.deploy_date ? `Deploy ${fmt(r.deploy_date)}` : "Belum ada tanggal deploy"} · {stories.length} story · {pts} pt
                  </div>
                </div>
                <RowActions
                  onEdit={() => openForm(r)}
                  onDelete={() => confirm(`Hapus release v${r.fix_version}?`) && remove("releases", r.id)}
                />
              </div>

              <div className="space-y-4 px-5 py-4">
                <div>
                  <Label>Epic di release ini</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {epics.length ? (
                      epics.map((e) => (
                        <span key={e!.id} className="rounded-full bg-mist-100 px-2 py-0.5 text-xs text-ink-700">
                          {e!.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-mist-400">
                        Belum ada story yang di-assign ke fix version ini.
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Folder dokumen</Label>
                  {r.folder_url ? (
                    <a href={r.folder_url} target="_blank" rel="noreferrer"
                      className="mt-0.5 block truncate text-xs text-ocean-600 underline underline-offset-2">
                      🔗 {r.folder_url}
                    </a>
                  ) : (
                    <span className="text-xs text-mist-400">Belum ada URL folder SharePoint.</span>
                  )}
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <Label>Kelengkapan dokumen</Label>
                    <span className="font-mono text-[10px] text-mist-400">{filled}/{need}</span>
                  </div>
                  <Progress pct={(filled / need) * 100} tone={filled === need ? "bg-ocean-600" : "bg-sun-500"} />
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {DOC_TYPES.map((t) => {
                      const url = data.docs.find((d) => d.release_id === r.id && d.doc_type === t)?.url;
                      return url ? (
                        <a key={t} href={url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 rounded-lg bg-ocean-100 px-2 py-1 text-xs text-ocean-600 hover:bg-ocean-200">
                          ✅ {t}
                        </a>
                      ) : (
                        <span key={t} className="flex items-center gap-2 rounded-lg bg-mist-50 px-2 py-1 text-xs text-mist-400">
                          ⬜ {t}
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
          <div className="rounded-2xl border border-dashed border-mist-200 bg-white p-10 text-center lg:col-span-2">
            <div className="text-3xl">🚀</div>
            <p className="mt-2 text-sm text-mist-600">
              Belum ada fix version. Bikin satu, lalu assign story-nya dari menu Story.
            </p>
          </div>
        )}
      </div>

      {form && (
        <Modal
          title={form.id ? `Ubah release v${form.fix_version}` : "Fix version baru"}
          subtitle="Dokumen tetap di SharePoint — di sini cuma disimpan URL-nya."
          onClose={() => setForm(null)}
          wide
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Fix version">
                <input className={inputCls + " font-mono"} value={form.fix_version ?? ""}
                  onChange={(e) => setForm({ ...form, fix_version: e.target.value })} placeholder="1.13.0" />
              </Field>
              <Field label="Tanggal deploy" hint="Release dihitung masuk semester berdasarkan tanggal ini.">
                <input type="date" className={inputCls} value={form.deploy_date ?? ""}
                  onChange={(e) => setForm({ ...form, deploy_date: e.target.value })} />
              </Field>
            </div>

            <Field label="URL folder SharePoint">
              <input className={inputCls} value={form.folder_url ?? ""}
                onChange={(e) => setForm({ ...form, folder_url: e.target.value })}
                placeholder="https://…/00. Done Deploy/1.13.0" />
            </Field>

            <div>
              <Label>URL dokumen deployment</Label>
              <div className="mt-2 space-y-2">
                {DOC_TYPES.map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <span className="w-28 shrink-0 font-mono text-xs text-mist-600">{t}</span>
                    <input className={inputCls} value={docs[t] ?? ""}
                      onChange={(e) => setDocs({ ...docs, [t]: e.target.value })} placeholder="https://sharepoint…" />
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
