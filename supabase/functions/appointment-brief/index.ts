import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { user_id, schedule_item_id } = await req.json();
    if (!user_id || !schedule_item_id) {
      return new Response(JSON.stringify({ error: "user_id and schedule_item_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "missing LOVABLE_API_KEY" }), { status: 500, headers: corsHeaders });

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const [{ data: item }, { data: meds }, { data: profile }] = await Promise.all([
      sb.from("schedule_items").select("*").eq("id", schedule_item_id).eq("user_id", user_id).maybeSingle(),
      sb.from("medications").select("name,dose,schedule,purpose").eq("user_id", user_id),
      sb.from("profiles").select("family_history").eq("id", user_id).maybeSingle(),
    ]);

    if (!item) {
      return new Response(JSON.stringify({ error: "schedule item not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Pull entries from the 60 days before the appointment
    const since = new Date(Date.now() - 60 * 86400000).toISOString();
    const { data: entries } = await sb
      .from("entries")
      .select("entry_date,body,mood,symptoms,doctor,visit_type,ai_summary")
      .eq("user_id", user_id)
      .gte("entry_date", since)
      .order("entry_date", { ascending: false })
      .limit(30);

    const { data: vitals } = await sb
      .from("vitals")
      .select("type,value,value_text,unit,recorded_at")
      .eq("user_id", user_id)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: false })
      .limit(40);

    const system = `You are helping a patient prepare for a specific upcoming appointment. Generate focused, specific talking points — not generic ones. Reference what the user actually wrote about. Keep each item one clear sentence.`;
    const userMsg = `UPCOMING APPOINTMENT:
${JSON.stringify(item)}

JOURNAL ENTRIES (last 60 days):
${JSON.stringify(entries ?? [])}

CURRENT MEDICATIONS:
${JSON.stringify(meds ?? [])}

RECENT VITALS:
${JSON.stringify(vitals ?? [])}

FAMILY HISTORY:
${JSON.stringify(profile?.family_history ?? {})}

Tailor the brief to this appointment's title/kind (${item.kind}: ${item.title}).`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, { role: "user", content: userMsg }],
        tools: [{
          type: "function",
          function: {
            name: "appointment_brief",
            parameters: {
              type: "object",
              properties: {
                opening: { type: "string", description: "One sentence the patient can say to open: 'I'm here today because…'" },
                tell_the_doctor: { type: "array", items: { type: "string" }, description: "3-5 specific things to tell the doctor, grounded in the journal entries" },
                questions: { type: "array", items: { type: "string" }, description: "3-5 specific questions to ask, tied to this appointment" },
                bring_up_medications: { type: "array", items: { type: "string" }, description: "Med-related items: side effects mentioned, missed doses, requests for review" },
                red_flags: { type: "array", items: { type: "string" }, description: "Symptoms or concerns the doctor should not miss" },
              },
              required: ["opening", "tell_the_doctor", "questions"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "appointment_brief" } },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: "ai gateway", detail: t }), { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await res.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = call ? JSON.parse(call.function.arguments) : {};
    return new Response(JSON.stringify({ brief: args, item }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
