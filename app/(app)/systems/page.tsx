"use client";

import { useMemo, useState } from "react";
import { useTracker } from "@/lib/useTracker";
import { ENVIRONMENTS, type Environment, type System } from "@/lib/types";
import {
  Badge, Btn, Card, EmptyRow, ErrorBar, Field, FormActions, Loading, Modal,
  PageHead, ROW, RowActions, Select, Td, Th, filterCls, inputCls,
} from "@/components/ui";

/** URL dirapikan jadi domain + path pendek supaya kolomnya tidak melebar. */
const shortUrl = (url: string) => {
  try {
    const u = new URL(url);
    return u.host + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return url;
  }
};

const blank = (): Partial<System> => ({
  name: "", description: "", url: "", environments: [], epic_id: null,
});

export default function SystemsPage() {
  const { data, loading, error, save, remove } = useTracker();
  const [q, setQ] = useState("");
  const [envF, setEnvF] = useState("all");
  const [form, setForm] = useState<Partial<System> | null>(null);

  const epicById = useMemo(() => Object.fromEntries(data.epics.map((e) => [e.id, e])), [data.epics]);

  const rows = useMemo(
    () =>
      data.systems.filter(
        (s) =>
          (envF === "all" || (s.environments ?? []).includes(envF as Environment)) &&
          (!q || `${s.name} ${s.description ?? ""} ${s.url ?? ""}`.toLowerCase().includes(q.toLowerCase()))
      ),
    [data.systems, q, envF]
  );

  if (loading) return <Loading />;

  const submit = async () => {
    if (!form?.name) return;
    const row: Record<string, unknown> = {
      id: form.id,
      name: form.name,
      description: form.description ?? "",
      url: form.url ?? "",
      environments: form.environments ?? [],
      epic_id: form.epic_id || null,
    };
    if (!row.id) delete row.id;
    if (await save("systems", row)) setForm(null);
  };

  const toggleEnv = (env: Environment) => {
    const cur = form?.environments ?? [];
    setForm({
      ...form,
      environments: cur.includes(env) ? cur.filter((e) => e !== env) : [...cur, env],
    });
  };

  return (
    <div>
      <PageHead
        title="Sistem"
        sub="Daftar website/sistem yang dikembangkan atau berhubungan dengan project, beserta environment dan URL-nya."
      >
        <input className={filterCls + " w-56"} placeholder="🔍 Cari sistem…" value={q}
          onChange={(e) => setQ(e.target.value)} />
        <Select
          w="w-44"
          value={envF}
          onChange={setEnvF}
          options={[
            { value: "all", label: "Semua environment" },
            ...ENVIRONMENTS.map((e) => ({ value: e, label: e.toUpperCase() })),
          ]}
        />
        <Btn tone="accent" onClick={() => setForm(blank())}>+ Sistem</Btn>
      </PageHead>

      <ErrorBar msg={error} />

      <Card scroll offset="12rem">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th className="w-56">Nama</Th>
              <Th>Deskripsi</Th>
              <Th className="w-40">Environment</Th>
              <Th className="w-64">URL</Th>
              <Th className="w-44">Epic terkait</Th>
              <Th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className={ROW}>
                <Td className="font-medium text-ink-900">{s.name}</Td>
                <Td className="whitespace-pre-wrap text-xs text-mist-600">{s.description}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {(s.environments ?? []).length ? (
                      (s.environments ?? []).map((e) => <Badge key={e} v={e} />)
                    ) : (
                      <span className="text-xs text-mist-400">—</span>
                    )}
                  </div>
                </Td>
                <Td>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noreferrer"
                      className="block max-w-[16rem] truncate text-xs text-ocean-600 underline underline-offset-2"
                      title={s.url}>
                      🔗 {shortUrl(s.url)}
                    </a>
                  ) : (
                    <span className="text-xs text-mist-400">—</span>
                  )}
                </Td>
                <Td className="text-xs text-mist-600">{epicById[s.epic_id ?? ""]?.name ?? "—"}</Td>
                <Td>
                  <RowActions
                    onEdit={() => setForm(s)}
                    onDelete={() => confirm(`Hapus "${s.name}" dari daftar sistem?`) && remove("systems", s.id)}
                  />
                </Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <EmptyRow cols={6} icon="🖥️" msg="Belum ada sistem yang cocok. Tambahkan lewat + Sistem." />
            )}
          </tbody>
        </table>
      </Card>

      {form && (
        <Modal
          title={form.id ? "Ubah sistem" : "Sistem baru"}
          subtitle="Catat website/sistem beserta environment tempat ia berjalan."
          onClose={() => setForm(null)}
        >
          <div className="space-y-4">
            <Field label="Nama sistem">
              <input className={inputCls} value={form.name ?? ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Admin Portal DLB" />
            </Field>

            <Field label="Deskripsi">
              <textarea rows={3} className={inputCls} value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Portal internal untuk traffic controller dan assign taksasor." />
            </Field>

            <Field label="URL">
              <input className={inputCls} value={form.url ?? ""}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://admin.dlb.internal" />
            </Field>

            <Field label="Environment" hint="Boleh pilih lebih dari satu.">
              <div className="flex gap-2">
                {ENVIRONMENTS.map((env) => {
                  const on = (form.environments ?? []).includes(env);
                  return (
                    <button
                      key={env}
                      onClick={() => toggleEnv(env)}
                      className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                        on
                          ? "border-ocean-300 bg-ocean-100 text-ocean-700"
                          : "border-mist-200 bg-white text-mist-600 hover:bg-mist-50"
                      }`}
                    >
                      {on ? "✓ " : ""}{env.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Epic terkait" hint="Opsional — kaitkan ke project kalau relevan.">
              <Select
                full
                value={form.epic_id ?? ""}
                onChange={(v) => setForm({ ...form, epic_id: v || null })}
                options={[
                  { value: "", label: "— tanpa epic —" },
                  ...data.epics.map((e) => ({ value: e.id, label: e.name })),
                ]}
              />
            </Field>

            <FormActions onClose={() => setForm(null)} onSave={submit} />
          </div>
        </Modal>
      )}
    </div>
  );
}
