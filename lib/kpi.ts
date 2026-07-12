import type { Epic, Release, Story, Tracker } from "./types";

export type Semester = {
  half: 1 | 2;
  year: number;
  label: string;
  start: string; // YYYY-MM-DD
  end: string;
  months: string[];
};

export function semesterOf(year: number, half: 1 | 2): Semester {
  return {
    half,
    year,
    label: `Semester ${half} · ${year}`,
    start: half === 1 ? `${year}-01-01` : `${year}-07-01`,
    end: half === 1 ? `${year}-06-30` : `${year}-12-31`,
    months:
      half === 1
        ? ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"]
        : ["Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
  };
}

export function currentSemester(): Semester {
  const d = new Date();
  return semesterOf(d.getFullYear(), d.getMonth() < 6 ? 1 : 2);
}

export const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

export const fmt = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

export const inSemester = (iso: string | null, s: Semester) =>
  !!iso && iso >= s.start && iso <= s.end;

/** Epic dianggap "berjalan di semester ini" kalau periodenya beririsan dengan rentang semester. */
export const overlapsSemester = (e: Epic, s: Semester) => {
  if (!e.start_date) return false;
  const end = e.end_date || "9999-12-31";
  return e.start_date <= s.end && end >= s.start;
};

export type EpicStat = { total: number; points: number; done: number; donePoints: number };

export function epicStats(t: Tracker): Record<string, EpicStat> {
  const m: Record<string, EpicStat> = {};
  t.epics.forEach((e) => (m[e.id] = { total: 0, points: 0, done: 0, donePoints: 0 }));
  t.stories.forEach((s) => {
    if (!s.epic_id) return;
    const x = m[s.epic_id];
    if (!x) return;
    x.total += 1;
    x.points += num(s.story_points);
    if (s.progress === "Done") {
      x.done += 1;
      x.donePoints += num(s.story_points);
    }
  });
  return m;
}

export type Kpi = {
  sem: Semester;
  epicsRunning: Epic[];
  epicsDone: Epic[];
  storiesDone: Story[];
  pointsDone: number;
  releases: Release[];
  sprints: number[];
};

export function computeKpi(t: Tracker, sem: Semester): Kpi {
  const epicsRunning = t.epics
    .filter((e) => overlapsSemester(e, sem))
    .sort((a, b) => (a.start_date || "").localeCompare(b.start_date || ""));
  const epicsDone = epicsRunning.filter((e) => inSemester(e.end_date, sem));
  const storiesDone = t.stories.filter((s) => s.progress === "Done" && inSemester(s.end_date, sem));
  const pointsDone = storiesDone.reduce((a, s) => a + num(s.story_points), 0);
  const releases = t.releases.filter((r) => inSemester(r.deploy_date, sem));
  const sprints = Array.from(
    new Set(storiesDone.map((s) => s.sprint).filter((x): x is number => x != null))
  ).sort((a, b) => a - b);
  return { sem, epicsRunning, epicsDone, storiesDone, pointsDone, releases, sprints };
}

/** Teks rekap siap tempel ke email / deck manager. */
export function recapText(t: Tracker, kpi: Kpi): string {
  const stats = epicStats(t);
  const relById = Object.fromEntries(t.releases.map((r) => [r.id, r]));
  const L: string[] = [];

  L.push(`REKAP ${kpi.sem.label.toUpperCase()} — SQUAD LSS`, "");
  L.push(
    `Ringkasan: ${kpi.epicsRunning.length} project berjalan, ${kpi.epicsDone.length} selesai, ` +
      `${kpi.pointsDone} story point delivered dari ${kpi.storiesDone.length} story, ` +
      `${kpi.releases.length} release ke production.`,
    ""
  );

  kpi.epicsRunning.forEach((e, i) => {
    const st = stats[e.id] || { total: 0, points: 0, done: 0, donePoints: 0 };
    const vers = Array.from(
      new Set(
        t.stories
          .filter((s) => s.epic_id === e.id && s.release_id && relById[s.release_id])
          .map((s) => relById[s.release_id!].fix_version)
      )
    );
    L.push(`${i + 1}. ${e.name}${e.jira_key ? ` (${e.jira_key})` : ""}`);
    L.push(
      `   Status: ${e.status} · Periode: ${fmt(e.start_date)} – ${fmt(e.end_date)} · ` +
        `${st.done}/${st.total} story · ${st.donePoints}/${st.points} point`
    );
    if (vers.length) L.push(`   Release: ${vers.join(", ")}`);
    if (e.notes) L.push(`   Catatan: ${e.notes.replace(/\n/g, " · ")}`);
    L.push("");
  });

  if (kpi.releases.length) {
    L.push("Release ke production:");
    kpi.releases.forEach((r) => L.push(`- v${r.fix_version} (${fmt(r.deploy_date)})`));
    L.push("");
  }
  if (kpi.sprints.length) L.push(`Sprint terlibat: ${kpi.sprints.join(", ")}`);
  return L.join("\n");
}

/** Posisi & lebar bar epic di strip 6 bulan (persen). */
export function barGeom(e: Epic, s: Semester) {
  const days = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 86400000;
  const span = days(s.start, s.end) || 1;
  const from = e.start_date && e.start_date > s.start ? e.start_date : s.start;
  const to = e.end_date && e.end_date < s.end ? e.end_date : s.end;
  const left = Math.max(0, (days(s.start, from) / span) * 100);
  const width = Math.max(2, Math.min(100 - left, (days(from, to) / span) * 100));
  return { left, width };
}

export function csvOfStories(t: Tracker): string {
  const epicName = (id: string | null) => t.epics.find((e) => e.id === id)?.name ?? "";
  const relName = (id: string | null) => t.releases.find((r) => r.id === id)?.fix_version ?? "";
  const head = [
    "Epic", "Task List", "Story", "Jira", "Point", "Sprint",
    "Start", "End", "Progress", "Fix Version", "Status Release",
  ];
  const rows = t.stories.map((s) => [
    epicName(s.epic_id), s.task_group ?? "", s.title, s.jira_key ?? "",
    s.story_points ?? "", s.sprint ?? "", s.start_date ?? "", s.end_date ?? "",
    s.progress, relName(s.release_id), s.release_status,
  ]);
  return [head, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
