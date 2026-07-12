import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { adminClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/* --------------------------------------------------------------------
   Tarik issue dari Jira (read-only) ke Supabase.

   Yang DITIMPA dari Jira : judul, story point, sprint, tanggal sprint,
                            status Jira, dan (opsional) progress.
   Yang TIDAK DISENTUH    : task_group, release_id, release_status,
                            notes, tanggal & status epic, feature flag.
   Jadi kolom custom lu aman meski sync dijalankan berkali-kali.
-------------------------------------------------------------------- */

type JiraIssue = {
  key: string;
  fields: Record<string, any>;
};

const mapProgress = (statusCategoryKey?: string) => {
  if (statusCategoryKey === "done") return "Done";
  if (statusCategoryKey === "indeterminate") return "In Dev";
  return "Todo";
};

async function requireUser() {
  const store = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => store.getAll(), setAll: () => {} } }
  );
  const { data } = await sb.auth.getUser();
  return data.user;
}

const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY } = process.env;
  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    // sebutkan variabel mana yang kosong, biar nggak nebak-nebak
    const missing = Object.entries({ JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN })
      .filter(([, v]) => !v)
      .map(([k]) => k);
    return NextResponse.json(
      { error: `Environment variable belum terbaca: ${missing.join(", ")}. Kalau sudah diisi di Vercel, redeploy dulu.` },
      { status: 400 }
    );
  }

  const spField = process.env.JIRA_STORY_POINTS_FIELD || "customfield_10016";
  const sprintField = process.env.JIRA_SPRINT_FIELD || "customfield_10020";

  const body = await req.json().catch(() => ({}));
  const jql: string =
    body.jql ||
    process.env.JIRA_DEFAULT_JQL ||
    `project = ${JIRA_PROJECT_KEY || "DLB"} ORDER BY updated DESC`;
  const overwriteProgress: boolean = body.overwriteProgress !== false;

  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");
  const fields = ["summary", "status", "issuetype", "parent", "resolutiondate", spField, sprintField].join(",");

  /* ---------- ambil semua issue (maks 5 halaman × 100) ---------- */
  const issues: JiraIssue[] = [];
  try {
    for (let page = 0; page < 5; page++) {
      const url =
        `${JIRA_BASE_URL}/rest/api/3/search?jql=${encodeURIComponent(jql)}` +
        `&fields=${encodeURIComponent(fields)}&startAt=${page * 100}&maxResults=100`;
      const res = await fetch(url, {
        headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) {
        const msg = await res.text();
        return NextResponse.json(
          { error: `Jira menolak permintaan (${res.status}). Cek JQL / API token. ${msg.slice(0, 200)}` },
          { status: 400 }
        );
      }
      const json = await res.json();
      issues.push(...(json.issues ?? []));
      if (issues.length >= (json.total ?? 0) || (json.issues ?? []).length === 0) break;
    }
  } catch (e: any) {
    return NextResponse.json({ error: `Tidak bisa menghubungi Jira: ${e.message}` }, { status: 502 });
  }

  const db = adminClient();
  const epicIssues = issues.filter((i) => i.fields.issuetype?.name === "Epic");
  const storyIssues = issues.filter((i) => i.fields.issuetype?.name !== "Epic");

  /* ---------- epics: hanya nama & key, status/tanggal tetap milik lu ---------- */
  let epicCount = 0;
  if (epicIssues.length) {
    const rows = epicIssues.map((i) => ({ jira_key: i.key, name: i.fields.summary as string }));
    const { error } = await db.from("epics").upsert(rows, { onConflict: "jira_key" });
    if (error) return NextResponse.json({ error: "Gagal simpan epic: " + error.message }, { status: 500 });
    epicCount = rows.length;
  }

  // peta jira_key -> id, untuk menyambungkan story ke epic-nya
  const { data: allEpics } = await db.from("epics").select("id,jira_key");
  const epicIdByKey = new Map((allEpics ?? []).filter((e) => e.jira_key).map((e) => [e.jira_key!, e.id]));

  // story yang sudah ada: dipakai agar sync tidak menimpa field lokal
  const { data: existing } = await db.from("stories").select("id,jira_key,progress,epic_id");
  const existingByKey = new Map((existing ?? []).map((s) => [s.jira_key, s]));

  /* ---------- stories ---------- */
  let storyCount = 0;
  if (storyIssues.length) {
    const rows = storyIssues.map((i) => {
      const f = i.fields;
      const sprints: any[] = Array.isArray(f[sprintField]) ? f[sprintField] : [];
      const last = sprints[sprints.length - 1];
      const prev = existingByKey.get(i.key);
      const parentKey: string | undefined = f.parent?.key;

      const row: Record<string, unknown> = {
        jira_key: i.key,
        title: f.summary,
        story_points: Number(f[spField]) || 0,
        sprint: last?.id ? Number(last.name?.match(/\d+/)?.[0] ?? last.id) : null,
        jira_status: f.status?.name ?? "",
        synced_at: new Date().toISOString(),
      };

      // Tanggal story = jendela sprint-nya (persis seperti di sheet lama).
      if (last?.startDate) row.start_date = String(last.startDate).slice(0, 10);
      if (last?.endDate) row.end_date = String(last.endDate).slice(0, 10);

      // Epic hanya di-set kalau ketemu; kalau lu sudah assign manual, biarkan.
      const epicId = parentKey ? epicIdByKey.get(parentKey) : undefined;
      if (epicId) row.epic_id = epicId;
      else if (prev?.epic_id) row.epic_id = prev.epic_id;

      if (overwriteProgress) row.progress = mapProgress(f.status?.statusCategory?.key);
      else if (prev) row.progress = prev.progress;

      return row;
    });

    const { error } = await db.from("stories").upsert(rows, { onConflict: "jira_key" });
    if (error) return NextResponse.json({ error: "Gagal simpan story: " + error.message }, { status: 500 });
    storyCount = rows.length;
  }

  await db.from("sync_runs").insert({
    jql,
    epics_upsert: epicCount,
    stories_upsert: storyCount,
    status: "ok",
    message: `${issues.length} issue diproses`,
  });

  return NextResponse.json({ ok: true, epics: epicCount, stories: storyCount, total: issues.length });
}
