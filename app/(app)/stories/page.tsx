"use client";

import { Fragment, useState } from "react";
import { useTracker } from "@/lib/useTracker";
import { fmt, num } from "@/lib/kpi";
import { RELEASE_STATUS, STORY_PROGRESS, type Story } from "@/lib/types";
import {
  Badge, Btn, Card, EmptyRow, ErrorBar, Field, FormActions, JiraLink, Loading,
  Modal, PageHead, RowActions, Td, Th, inputCls,
} from "@/components/ui";

const blank = (): Partial<Story> => ({
  epic_id: null, task_group: "", title: "", jira_key: "", story_points: 0,
  sprint: null, start_date: null, end_date: null, progress: "Todo",
  release_id: null, release_status: "-",
});

export default function StoriesPage() {
  const { data, loading, error, save, remove, patch } = useTracker();
  const [epicF, setEpicF] = useState("all");
  const [progF, setProgF] = useState("all");
  const [q, setQ] = useState("");
  const [form, setForm] = useState<Partial<Story> | null>(null);

  if (loading) return <Loading />;

  const epicName = (id: string | null) => data.epics.find((e) => e.id === id)?.name ?? "Epic belum di-set";
  const relName = (id: string | null) => data.releases.find((r) => r.id === id)?.fix_version;

  const rows = data.stories.filter(
    (s) =>
      (epicF === "all" || s.epic_id === epicF) &&
      (progF === "all" || s.progress === progF) &&
      (!q || `${s.title} ${s.jira_key ?? ""} ${s.task_group ?? ""}`.toLowerCase().includes(q.toLowerCase()))
  );

  const groups = rows.reduce<Record<string, Story[]>>((acc, s) => {
    const key = `${epicName(s.epic_id)} › ${s.task_group || "Tanpa grup"}`;
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  const submit = async () => {
    if (!form?.title) return;
    const row: Record<string, unknown> = { ...form };
    (["start_date", "end_date", "jira_key", "epic_id", "release_id"] as const).forEach((k) => {
      if (!row[k]) row[k] = null;
    });
    row.story_points = num(form.story_points);
    row.sprint = form.sprint ? num(form.sprint) : null;
    if (await save("stories", row)) setForm(null);
  };

  const cycleProgress = (s: Story) =>
    patch("stories", s.id, {
      progress: STORY_PROGRESS[(STORY_PROGRESS.indexOf(s.progress) + 1) % STORY_PROGRESS.length],
    });

  return (
    <div className="space-y-4">
      <ErrorBar msg={error} />
      <PageHead
        title="Story"
        sub="Klik badge progress untuk ganti cepat: Todo → In Dev → Done."
      >
        <input
          className={inputCls + " w-48"}
          placeholder="Cari story / DLB-…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={epicF} onChange={(e) => setEpicF(e.target.value)} className={inputCls + " w-56"}>
          <option value="all">Semua epic</option>
          {data.epics.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <select value={progF} onChange={(e) => setProgF(e.target.value)} className={inputCls + " w-36"}>
          <option value="all">Semua progress</option>
          {STORY_PROGRESS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <Btn tone="solid" onClick={() => setForm(blank())}>+ Story</Btn>
      </PageHead>

      <Card>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>Story</Th>
              <Th className="w-24">Jira</Th>
              <Th className="w-16 text-right">Point</Th>
              <Th className="w-20 text-right">Sprint</Th>
              <Th className="w-28">Start</Th>
              <Th className="w-28">End</Th>
              <Th className="w-28">Progress</Th>
              <Th className="w-28">Fix version</Th>
              <Th className="w-36">Status release</Th>
              <Th className="w-24" />
            </tr>
          </thead>
          <tbody>
            {Object.entries(groups).map(([g, list]) => (
              <Fragment key={g}>
                <tr>
                  <td colSpan={10} className="border-b border-slate-200 bg-slate-900 px-3 py-1.5">
                    <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">{g}</span>
                    <span className="ml-3 font-mono text-[10px] text-slate-400">
                      {list.length} story · {list.reduce((a, s) => a + num(s.story_points), 0)} pt
                    </span>
                  </td>
                </tr>
                {list.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <Td className="text-slate-900">{s.title}</Td>
                    <Td><JiraLink k={s.jira_key} /></Td>
                    <Td className="text-right font-mono text-xs">{s.story_points || "—"}</Td>
                    <Td className="text-right font-mono text-xs">{s.sprint ?? "—"}</Td>
                    <Td className="font-mono text-xs">{fmt(s.start_date)}</Td>
                    <Td className="font-mono text-xs">{fmt(s.end_date)}</Td>
                    <Td>
                      <button onClick={() => cycleProgress(s)} title="Klik untuk ganti progress">
                        <Badge v={s.progress} />
                      </button>
                    </Td>
                    <Td className="font-mono text-xs">{relName(s.release_id) ?? "—"}</Td>
                    <Td><Badge v={s.release_status} /></Td>
                    <Td>
                      <RowActions
                        onEdit={() => setForm(s)}
                        onDelete={() => confirm(`Hapus story "${s.title}"?`) && remove("stories", s.id)}
                      />
                    </Td>
                  </tr>
                ))}
              </Fragment>
            ))}
            {rows.length === 0 && <EmptyRow cols={10} msg="Tidak ada story yang cocok dengan filter." />}
          </tbody>
        </table>
      </Card>

      {form && (
        <Modal title={form.id ? "Ubah story" : "Story baru"} onClose={() => setForm(null)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Epic">
                <select
                  className={inputCls}
                  value={form.epic_id ?? ""}
                  onChange={(e) => setForm({ ...form, epic_id: e.target.value || null })}
                >
                  <option value="">— belum di-set —</option>
                  {data.epics.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Task list (grup)">
                <input
                  className={inputCls}
                  value={form.task_group ?? ""}
                  onChange={(e) => setForm({ ...form, task_group: e.target.value })}
                  placeholder="Appraisal Portal Phase 0: Base Feature"
                />
              </Field>
            </div>

            <Field label="Judul story">
              <input
                className={inputCls}
                value={form.title ?? ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Taksasi Tab - Appraisal Request List"
              />
            </Field>

            <div className="grid grid-cols-4 gap-4">
              <Field label="Jira key">
                <input
                  className={inputCls + " font-mono"}
                  value={form.jira_key ?? ""}
                  onChange={(e) => setForm({ ...form, jira_key: e.target.value.toUpperCase() })}
                  placeholder="DLB-13758"
                />
              </Field>
              <Field label="Story point">
                <input
                  type="number"
                  className={inputCls}
                  value={form.story_points ?? 0}
                  onChange={(e) => setForm({ ...form, story_points: Number(e.target.value) })}
                />
              </Field>
              <Field label="Sprint">
                <input
                  type="number"
                  className={inputCls}
                  value={form.sprint ?? ""}
                  onChange={(e) => setForm({ ...form, sprint: e.target.value ? Number(e.target.value) : null })}
                />
              </Field>
              <Field label="Progress">
                <select
                  className={inputCls}
                  value={form.progress ?? "Todo"}
                  onChange={(e) => setForm({ ...form, progress: e.target.value as Story["progress"] })}
                >
                  {STORY_PROGRESS.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Start">
                <input type="date" className={inputCls} value={form.start_date ?? ""}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </Field>
              <Field label="End">
                <input type="date" className={inputCls} value={form.end_date ?? ""}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Fix version">
                <select
                  className={inputCls}
                  value={form.release_id ?? ""}
                  onChange={(e) => setForm({ ...form, release_id: e.target.value || null })}
                >
                  <option value="">— belum masuk release —</option>
                  {data.releases.map((r) => (
                    <option key={r.id} value={r.id}>v{r.fix_version}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status release">
                <select
                  className={inputCls}
                  value={form.release_status ?? "-"}
                  onChange={(e) => setForm({ ...form, release_status: e.target.value as Story["release_status"] })}
                >
                  {RELEASE_STATUS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>

            <FormActions onClose={() => setForm(null)} onSave={submit} />
          </div>
        </Modal>
      )}
    </div>
  );
}
