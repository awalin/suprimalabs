import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "missing LOVABLE_API_KEY" }), { status: 500, headers: corsHeaders });

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const since = new Date(Date.now() - 30 * 86400000).toISOString();

    const [{ data: entries }, { data: meds }, { data: vitals }, { data: profile }] = await Promise.all([
      sb.from("entries").select("entry_date,body,mood,symptoms,doctor,visit_type,ai_summary").eq("user_id", user_id).gte("entry_date", since).order("entry_date", { ascending: false }).limit(40),
      sb.from("medications").select("name,dose,schedule,purpose").eq("user_id", user_id),
      sb.from("vitals").select("type,value,value_text,unit,recorded_at").eq("user_id", user_id).gte("recorded_at", since).order("recorded_at", { ascending: false }).limit(60),
      sb.from("profiles").select("family_history").eq("id", user_id).maybeSingle(),
    ]);

    const system = `You are helping a patient prepare for a doctor visit. Based on their last 30 days of journal entries, medications, vitals, and family history, output a concise visit-prep brief.`;
    const userMsg = `ENTRIES: ${JSON.stringify(entries ?? [])}
MEDICATIONS: ${JSON.stringify(meds ?? [])}
VITALS: ${JSON.stringify(vitals ?? [])}
FAMILY HISTORY: ${JSON.stringify(profile?.family_history ?? {})}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, { role: "user", content: userMsg }],
        tools: [{
          type: "function",
          function: {
            name: "visit_prep",
            parameters: {
              type: "object",
              properties: {
                top_concerns: { type: "array", items: { type: "string" }, description: "3-5 most important concerns from recent entries" },
                symptoms_to_mention: { type: "array", items: { type: "string" } },
                questions_to_ask: { type: "array", items: { type: "string" }, description: "3-5 specific questions to bring up" },
                medication_questions: { type: "array", items: { type: "string" } },
                lifestyle_notes: { type: "array", items: { type: "string" } },
              },
              required: ["top_concerns", "questions_to_ask"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "visit_prep" } },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: "ai gateway", detail: t }), { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await res.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = call ? JSON.parse(call.function.arguments) : {};
    return new Response(JSON.stringify({
      prep: args,
      medications: meds ?? [],
      vitals: vitals ?? [],
      family_history: profile?.family_history ?? null,
      entry_count: entries?.length ?? 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
