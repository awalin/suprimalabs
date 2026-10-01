import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get("Authorization") ?? "";

    // Resolve the user: prefer a real session, fall back to an explicit user_id
    // (used while auth is bypassed for preview).
    let userId: string | null = null;
    if (authHeader) {
      const authed = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data } = await authed.auth.getUser();
      userId = data.user?.id ?? null;
    }
    if (!userId && typeof body?.user_id === "string") userId = body.user_id;
    if (!userId) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: entries } = await supabase.from("entries").select("entry_date,body,mood,symptoms,doctor,visit_type,ai_summary").eq("user_id", userId).order("entry_date", { ascending: false }).limit(40);
    const { data: meds } = await supabase.from("medications").select("name,dose,schedule,purpose,started_on,ended_on,notes").eq("user_id", userId);

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const sys = `You are a careful health journaling assistant. You DO NOT give medical advice. You summarize patterns the user can discuss with their doctor. Always include a brief safety disclaimer.`;
    const user = `Recent journal entries (newest first):\n${JSON.stringify(entries ?? [])}\n\nCurrent medications:\n${JSON.stringify(meds ?? [])}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        tools: [{
          type: "function",
          function: {
            name: "report",
            parameters: {
              type: "object",
              properties: {
                patterns: { type: "array", items: { type: "string" }, description: "Observed patterns over time" },
                medication_observations: { type: "array", items: { type: "string" } },
                questions_for_doctor: { type: "array", items: { type: "string" } },
                lifestyle_suggestions: { type: "array", items: { type: "string" } },
                disclaimer: { type: "string" },
              },
              required: ["patterns", "questions_for_doctor", "disclaimer"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report" } },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: "ai gateway", detail: t }), { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await res.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = call ? JSON.parse(call.function.arguments) : {};

    await supabase.from("insights").insert({ user_id: userId, content: args });
    return new Response(JSON.stringify(args), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
