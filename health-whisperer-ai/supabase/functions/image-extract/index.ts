import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { storage_path, kind } = await req.json();
    if (!storage_path) return new Response(JSON.stringify({ error: "storage_path required" }), { status: 400, headers: corsHeaders });

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: file, error: dlErr } = await admin.storage.from("health-attachments").download(storage_path);
    if (dlErr || !file) return new Response(JSON.stringify({ error: "download failed", detail: dlErr?.message }), { status: 500, headers: corsHeaders });

    const buf = new Uint8Array(await file.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    const b64 = btoa(bin);
    const mime = file.type || "image/jpeg";
    const dataUrl = `data:${mime};base64,${b64}`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const prompt = kind === "medicine"
      ? "Extract medicine name, dose, manufacturer, and any usage instructions visible on this image."
      : kind === "prescription"
      ? "Extract prescribed medications (name, dose, schedule, duration), prescriber name, date, and any instructions."
      : "Extract key lab/test results, test names, values, units, reference ranges, and any flags/notes.";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt + " Return concise JSON with a top-level 'summary' string and a 'fields' object." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        }],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: "ai gateway", detail: t }), { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await res.json();
    let parsed: any = {};
    try { parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}"); } catch { parsed = { summary: data.choices?.[0]?.message?.content }; }
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
