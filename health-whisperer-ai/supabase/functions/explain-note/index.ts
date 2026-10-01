import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Only references from these domains are surfaced to the user.
const TRUSTED = [
  "medlineplus.gov",
  "www.ncbi.nlm.nih.gov",
  "pubmed.ncbi.nlm.nih.gov",
  "www.nih.gov",
  "www.nhlbi.nih.gov",
  "www.niddk.nih.gov",
  "www.cancer.gov",
  "www.cdc.gov",
  "www.fda.gov",
  "dailymed.nlm.nih.gov",
  "www.mayoclinic.org",
  "www.acog.org",
  "www.heart.org",
  "www.diabetes.org",
  "www.who.int",
  "labtestsonline.org",
  "www.testing.com",
];

function sanitizeRefs(refs: unknown): { title: string; source: string; url: string }[] {
  if (!Array.isArray(refs)) return [];
  const out: { title: string; source: string; url: string }[] = [];
  for (const r of refs.slice(0, 8)) {
    const title = String((r as any)?.title ?? "").slice(0, 160);
    if (!title) continue;
    let url = String((r as any)?.url ?? "");
    let host = "";
    try {
      const u = new URL(url);
      host = u.hostname;
      if (u.protocol !== "https:") host = "";
    } catch {
      host = "";
    }
    if (!TRUSTED.includes(host)) {
      // Fall back to a search on a trusted consumer-health source instead of a possibly fabricated link.
      url = `https://medlineplus.gov/search/?query=${encodeURIComponent(title)}`;
      host = "medlineplus.gov";
    }
    out.push({ title, source: host, url });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { text, storage_path, kind } = await req.json();
    if (!text && !storage_path) return json({ error: "text or storage_path required" }, 400);

    const authHeader = req.headers.get("Authorization") ?? "";
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await anon.auth.getUser();
    if (!userData.user) return json({ error: "unauthorized" }, 401);

    const content: any[] = [];

    if (storage_path) {
      const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: file, error: dlErr } = await admin.storage.from("health-attachments").download(storage_path);
      if (dlErr || !file) return json({ error: "download failed", detail: dlErr?.message }, 500);
      const buf = new Uint8Array(await file.arrayBuffer());
      if (!buf.length) return json({ error: "empty file" }, 400);
      let bin = "";
      for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
      const b64 = btoa(bin);
      const mime = file.type || (storage_path.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
      const dataUrl = `data:${mime};base64,${b64}`;
      if (mime === "application/pdf") {
        content.push({
          type: "file",
          file: { filename: storage_path.split("/").pop() ?? "document.pdf", file_data: dataUrl },
        });
      } else {
        content.push({ type: "image_url", image_url: { url: dataUrl } });
      }
    }

    const instruction = `You are a careful health-literacy explainer. Explain this ${
      kind ?? "clinical document"
    } to a patient in plain, warm, everyday language at roughly an 8th-grade reading level.

Rules:
- Never diagnose and never give treatment instructions. Explain what the words and numbers mean.
- Define every piece of jargon, abbreviation, and lab abbreviation you see.
- If a value is outside a reference range, say plainly what that generally indicates and that only their clinician can interpret it for them.
- References MUST be real, stable pages on trusted sources only: MedlinePlus, NIH/NLM (including DailyMed for drugs), CDC, FDA, Mayo Clinic, WHO, ACOG, American Heart Association, American Diabetes Association, PubMed. Prefer MedlinePlus topic pages. Never invent a URL — if unsure of the exact page, use the source's topic page.

Return JSON only, shaped as:
{
  "title": string,
  "plain_summary": string,
  "key_points": string[],
  "glossary": [{ "term": string, "meaning": string }],
  "numbers": [{ "label": string, "value": string, "reference_range": string, "plain_meaning": string }],
  "questions_for_doctor": string[],
  "watch_for": string[],
  "references": [{ "title": string, "url": string }],
  "disclaimer": string
}`;

    content.unshift({ type: "text", text: instruction + (text ? `\n\nDocument text:\n${text}` : "") });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content }],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return json({ error: "ai gateway", detail: await res.text() }, res.status);

    const data = await res.json();
    let parsed: any = {};
    try {
      parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    } catch {
      parsed = { plain_summary: data.choices?.[0]?.message?.content };
    }
    parsed.references = sanitizeRefs(parsed.references);
    parsed.disclaimer = parsed.disclaimer ||
      "This is a plain-language explanation, not medical advice. Your clinician interprets your results.";
    return json(parsed);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
