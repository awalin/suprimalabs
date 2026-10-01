import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEMO_EMAIL = "demo@pulsejournal.app";
const DEMO_PASSWORD = "PulseDemo2026!";
const OLD_DEMO_ID = "00000000-0000-0000-0000-0000000000d1";

// One-time / idempotent setup: ensures a real demo auth user exists and that all
// previously seeded demo rows belong to it.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Find or create the demo user
    let userId: string | null = null;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    userId = list?.users?.find((u) => u.email === DEMO_EMAIL)?.id ?? null;

    if (!userId) {
      const { data, error } = await admin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: "Demo" },
      });
      if (error) return json({ error: error.message }, 500);
      userId = data.user!.id;
    } else {
      await admin.auth.admin.updateUserById(userId, { password: DEMO_PASSWORD, email_confirm: true });
    }

    // Move seeded demo data onto the real user
    const moved: Record<string, number | string> = {};
    for (const t of ["entries", "medications", "attachments", "insights", "vitals", "schedule_items"]) {
      const { data, error } = await admin.from(t).update({ user_id: userId }).eq("user_id", OLD_DEMO_ID).select("id");
      moved[t] = error ? error.message : (data?.length ?? 0);
    }

    // Ensure a profile row exists
    const { data: prof } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
    if (!prof) await admin.from("profiles").insert({ id: userId, display_name: "Demo" });

    const { data: oldProf } = await admin.from("profiles").select("family_history,demographics,reminder_time").eq("id", OLD_DEMO_ID).maybeSingle();
    if (oldProf) {
      await admin.from("profiles").update({
        family_history: oldProf.family_history,
        demographics: oldProf.demographics,
        reminder_time: oldProf.reminder_time,
      }).eq("id", userId);
    }

    return json({ ok: true, user_id: userId, email: DEMO_EMAIL, moved });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
