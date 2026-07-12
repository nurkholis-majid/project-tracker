"use client";

import Link from "next/link";
import { useTracker } from "@/lib/useTracker";
import { currentSemester, computeKpi, epicStats, fmt, num } from "@/lib/kpi";
import { Badge, Card, ErrorBar, JiraLink, Loading, Metric, PageHead, Td, Th } from "@/components/ui";
import { DOC_TYPES } from "@/lib/types";

export default function OverviewPage() {
  const { data, loading, error } = useTracker();
  if (loading) return <Loading />;

  const sem = currentSemester();
  const kpi = computeKpi(data, sem);
  const stats = epicStats(data);

  const active = data.epics.filter((e) => e.status !== "Hold" && !e.end_date);
  const inTesting = data.epics.filter((e) => e.status === "User Testing");
  const inDev = data.stories.filter((s) => s.progress === "In Dev");
  const doneNoRelease = data.stories.filter((s) => s.progress === "Done" && !s.release_id);

  // Hal yang biasanya kelewat waktu tutup semester:
  const attention: { what: string; detail: string; href: string }[] = [];

  data.releases.forEach((r) => {
    const missing = DOC_TYPES.filter(
      (t) => t !== "Lainnya" && !data.docs.find((d) => d.release_id === r.id && d.doc_type === t && d.url)
    );
    if (missing.length)
      attention.push({
        what: `v${r.fix_version} — dokumen belum lengkap`,
        detail: `Kurang: ${missing.join(", ")}`,
        href: "/releases",
      });
    if (!r.folder_url)
      attention.push({
        what: `v${r.fix_version} — folder SharePoint belum diisi`,
        detail: "URL folder dipakai sebagai bukti deployment di KPI.",
        href: "/releases",
      });
  });

  data.flags
    .filter((f) => f.uat === true && f.prod !== true)
    .forEach((f) =>
      attention.push({
        what: `${f.name} — sudah TRUE di UAT, belum di PROD`,
        detail: "Pastikan flag dinyalakan saat release, atau catat kenapa ditahan.",
        href: "/flags",
      })
    );

  data.epics
    .filter((e) => !e.start_date)
    .forEach((e) =>
      attention.push({
        what: `${e.name} — start date kosong`,
        detail: "Tanpa tanggal, epic ini tidak masuk hitungan semester manapun.",
        href: "/epics",
      })
    );

  if (doneNoRelease.length)
    attention.push({
      what: `${doneNoRelease.length} story sudah Done tapi belum masuk fix version`,
      detail: "Assign ke release supaya kelihatan jejak deploy-nya.",
      href: "/stories",
    });

  return (
    <div className="space-y-6">
      <PageHead
        title="Overview"
        sub={`Kondisi squad hari ini. Untuk angka KPI ${sem.label}, buka Rekap Semester.`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric v={active.length} k="Project berjalan" />
        <Metric v={inTesting.length} k="Menunggu user testing" />
        <Metric v={inDev.length} k="Story in dev" />
        <Metric v={kpi.pointsDone} k={`Point ${sem.label}`} accent />
        <Metric v={kpi.releases.length} k="Release semester ini" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-slate-500">
            Project yang belum selesai
          </h2>
          <Card>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Epic</Th>
                  <Th className="w-24">Jira</Th>
                  <Th className="w-32">Status</Th>
                  <Th className="w-28 text-right">Point</Th>
                  <Th className="w-28">Mulai</Th>
                  <Th className="w-32">Est. deploy</Th>
                </tr>
              </thead>
              <tbody>
                {active.map((e) => {
                  const st = stats[e.id];
                  return (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <Td className="font-medium text-slate-900">
                        <Link href="/epics" className="hover:underline">
                          {e.name}
                        </Link>
                      </Td>
                      <Td>
                        <JiraLink k={e.jira_key} />
                      </Td>
                      <Td>
                        <Badge v={e.status} />
                      </Td>
                      <Td className="text-right font-mono text-xs">
                        {num(st?.donePoints)}/{num(st?.points)}
                      </Td>
                      <Td className="font-mono text-xs">{fmt(e.start_date)}</Td>
                      <Td className="font-mono text-xs">{fmt(e.est_deploy)}</Td>
                    </tr>
                  );
                })}
                {active.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-400">
                      Semua epic sudah punya end date. Tambah epic baru di menu Epic / Project.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-slate-500">
            Perlu dibereskan
          </h2>
          <div className="space-y-2">
            {attention.slice(0, 12).map((a, i) => (
              <Link
                key={i}
                href={a.href}
                className="block rounded-lg border border-slate-200 bg-white p-3 hover:border-amber-300"
              >
                <div className="text-sm font-medium text-slate-900">{a.what}</div>
                <div className="mt-0.5 text-xs text-slate-500">{a.detail}</div>
              </Link>
            ))}
            {attention.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
                Bersih. Dokumen release lengkap dan semua epic punya tanggal.
              </div>
            )}
          </div>
        </section>
      </div>

      <ErrorBar msg={error} />
    </div>
  );
}
