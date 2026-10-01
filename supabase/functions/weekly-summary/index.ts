import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Totals = {
  entries: number;
  check_ins: number;
  moods: number[];
  symptoms: { name: string; count: number }[];
  medications: { name: string; dose: string | null }[];
  specialist_visits: { doctor: string; visit_type: string | null; date: string }[];
  vitals: number;
  upcoming: { title: string; start_at: string | null }[];
};

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));

async function buildSummary(admin: any, userId: string, days = 7) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const [{ data: entries }, { data: meds }, { data: vitals }, { data: sched }] = await Promise.all([
    admin.from("entries").select("entry_date,body,mood,symptoms,doctor,visit_type,ai_summary,entry_type").eq("user_id", userId).gte("entry_date", since).order("entry_date", { ascending: false }),
    admin.from("medications").select("name,dose,ended_on").eq("user_id", userId),
    admin.from("vitals").select("id").eq("user_id", userId).gte("recorded_at", since),
    admin.from("schedule_items").select("title,start_at").eq("user_id", userId).gte("start_at", new Date().toISOString()).order("start_at", { ascending: true }).limit(5),
  ]);

  const symptomCounts = new Map<string, number>();
  for (const e of entries ?? []) for (const s of e.symptoms ?? []) symptomCounts.set(s, (symptomCounts.get(s) ?? 0) + 1);

  const totals: Totals = {
    entries: entries?.length ?? 0,
    check_ins: (entries ?? []).filter((e: any) => e.entry_type === "checkin").length,
    moods: (entries ?? []).map((e: any) => e.mood).filter((m: any) => typeof m === "number"),
    symptoms: [...symptomCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    medications: (meds ?? []).filter((m: any) => !m.ended_on).map((m: any) => ({ name: m.name, dose: m.dose })),
    specialist_visits: (entries ?? []).filter((e: any) => e.doctor).map((e: any) => ({ doctor: e.doctor, visit_type: e.visit_type, date: e.entry_date })),
    vitals: vitals?.length ?? 0,
    upcoming: (sched ?? []).map((s: any) => ({ title: s.title, start_at: s.start_at })),
  };
  return totals;
}

function renderHtml(t: Totals, days: number) {
  const avgMood = t.moods.length ? (t.moods.reduce((a, b) => a + b, 0) / t.moods.length).toFixed(1) : "—";
  const d = (s: string) => new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const list = (items: string[]) => items.length ? `<ul style="margin:6px 0 0;padding-left:18px">${items.map((i) => `<li style="margin:3px 0">${i}</li>`).join("")}</ul>` : `<p style="margin:6px 0 0;color:#5A6B72">Nothing logged this week.</p>`;
  return `<!doctype html><html><body style="margin:0;background:#F4F7F8;font-family:Arial,Helvetica,sans-serif;color:#1B2A30">
<div style="max-width:600px;margin:0 auto;padding:24px">
  <h1 style="font-size:20px;margin:0 0 4px;color:#27788F">Your week in Pulse Journal</h1>
  <p style="margin:0 0 20px;color:#5A6B72;font-size:13px">Last ${days} days</p>
  <table width="100%" cellpadding="0" cellspacing="8" style="margin-bottom:16px">
    <tr>
      ${[["Entries", String(t.entries)], ["Avg mood", avgMood], ["Symptoms", String(t.symptoms.length)], ["Visits", String(t.specialist_visits.length)]]
        .map(([l, v]) => `<td align="center" style="background:#fff;border-radius:10px;padding:14px"><div style="font-size:22px;font-weight:bold;color:#27788F">${v}</div><div style="font-size:11px;color:#5A6B72">${l}</div></td>`).join("")}
    </tr>
  </table>
  <div style="background:#fff;border-radius:10px;padding:16px;margin-bottom:12px">
    <strong style="font-size:14px">Symptoms logged</strong>
    ${list(t.symptoms.map((s) => `${esc(s.name)} — ${s.count}×`))}
  </div>
  <div style="background:#fff;border-radius:10px;padding:16px;margin-bottom:12px">
    <strong style="font-size:14px">Current medications</strong>
    ${list(t.medications.map((m) => esc(m.name) + (m.dose ? ` (${esc(m.dose)})` : "")))}
  </div>
  <div style="background:#fff;border-radius:10px;padding:16px;margin-bottom:12px">
    <strong style="font-size:14px">Specialist visits</strong>
    ${list(t.specialist_visits.map((v) => `${esc(v.doctor)}${v.visit_type ? ` — ${esc(v.visit_type)}` : ""} · ${d(v.date)}`))}
  </div>
  ${t.upcoming.length ? `<div style="background:#fff;border-radius:10px;padding:16px;margin-bottom:12px"><strong style="font-size:14px">Coming up</strong>${list(t.upcoming.map((u) => `${esc(u.title)}${u.start_at ? ` · ${d(u.start_at)}` : ""}`))}</div>` : ""}
  <p style="font-size:11px;color:#5A6B72;margin-top:18px">Pulse Journal is a personal record and does not provide medical advice.</p>
</div></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const body = await req.json().catch(() => ({}));
    const days = Number(body?.days) > 0 ? Number(body.days) : 7;
    const preview = body?.preview === true;
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Resolve the caller when a session is present (used by the in-app preview button)
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization") ?? "";
    if (authHeader) {
      const authed = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await authed.auth.getUser();
      userId = data.user?.id ?? null;
    }

    if (preview) {
      if (!userId) return json({ error: "unauthorized" }, 401);
      const totals = await buildSummary(admin, userId, days);
      return json({ totals, html: renderHtml(totals, days) });
    }

    // Scheduled run: every user with at least one entry in the window
    const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM = Deno.env.get("PULSE_EMAIL_FROM");
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const results: { email: string; sent: boolean; entries: number; reason?: string }[] = [];

    for (const u of list?.users ?? []) {
      if (!u.email) continue;
      const totals = await buildSummary(admin, u.id, days);
      if (totals.entries === 0 && totals.medications.length === 0) continue;
      let sent = false, reason: string | undefined;
      if (RESEND_KEY && FROM) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: FROM, to: [u.email], subject: "Your week in Pulse Journal", html: renderHtml(totals, days) }),
        });
        sent = res.ok;
        if (!res.ok) reason = await res.text();
      } else {
        reason = "email sender not configured";
      }
      results.push({ email: u.email, sent, entries: totals.entries, reason });
    }
    return json({ ok: true, results });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
