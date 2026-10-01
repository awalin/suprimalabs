import { corsHeaders } from "../_shared/cors.ts";
import { demographicContext } from "../_shared/evidence.ts";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

type SearchHit = { title: string; url: string; snippet: string };

function decode(s: string) {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/* ---------------- web search (best effort, several engines) ---------------- */

async function braveSearch(query: string, limit: number): Promise<SearchHit[]> {
  const res = await fetch(`https://search.brave.com/search?q=${encodeURIComponent(query)}`, {
    headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const blocks = html.split('<div class="snippet ').slice(1);
  const hits: SearchHit[] = [];
  for (const block of blocks) {
    if (!block.includes('data-type="web"')) continue;
    const chunk = block.slice(0, 6000);
    const url = chunk.match(/href="(https?:\/\/[^"]+)"/)?.[1];
    if (!url) continue;
    const text = decode(chunk).slice(0, 700);
    hits.push({ title: text.slice(0, 140), url, snippet: text });
    if (hits.length >= limit) break;
  }
  return hits;
}

async function bingSearch(query: string, limit: number): Promise<SearchHit[]> {
  const res = await fetch(
    `https://www.bing.com/search?q=${encodeURIComponent(query)}&format=rss&count=${limit}&mkt=en-US`,
    { headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" } },
  );
  if (!res.ok) return [];
  const xml = await res.text();
  const hits: SearchHit[] = [];
  for (const it of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const b = it[1];
    const title = decode(b.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
    const url = decode(b.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "");
    const snippet = decode(b.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? "");
    if (title && url.startsWith("http")) hits.push({ title, url, snippet });
  }
  return hits.slice(0, limit);
}

async function webSearch(query: string, limit = 6): Promise<SearchHit[]> {
  for (const engine of [braveSearch, bingSearch]) {
    try {
      const hits = await engine(query, limit);
      if (hits.length) return hits;
    } catch (e) {
      console.log("search engine failed:", (e as Error).message);
    }
  }
  return [];
}

/* ---------------- official provider registry (NPPES / NPI) ---------------- */

type Registry = {
  name: string;
  practice: string | null;
  specialty: string | null;
  address: string | null;
  phone: string | null;
  npi: string;
};

function titleCase(s: string) {
  return s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

async function npiLookup(taxonomy: string, city: string, state: string, postal: string) {
  const attempts: Record<string, string>[] = [];
  if (city && state) attempts.push({ city, state, taxonomy_description: taxonomy });
  if (postal) attempts.push({ postal_code: `${postal.slice(0, 3)}*`, taxonomy_description: taxonomy });
  if (state) attempts.push({ state, taxonomy_description: taxonomy });

  const found: Registry[] = [];
  const seen = new Set<string>();
  for (const params of attempts) {
    const qs = new URLSearchParams({ version: "2.1", limit: "20", ...params });
    try {
      const res = await fetch(`https://npiregistry.cms.hhs.gov/api/?${qs}`);
      if (!res.ok) continue;
      const data = await res.json();
      for (const r of data.results ?? []) {
        if (seen.has(r.number)) continue;
        seen.add(r.number);
        const basic = r.basic ?? {};
        const name = basic.organization_name
          ? titleCase(basic.organization_name)
          : titleCase(`${basic.first_name ?? ""} ${basic.last_name ?? ""}`.trim());
        if (!name) continue;
        const addr = (r.addresses ?? []).find((a: any) => a.address_purpose === "LOCATION") ?? r.addresses?.[0];
        const tax = (r.taxonomies ?? []).find((t: any) => t.primary) ?? r.taxonomies?.[0];
        found.push({
          name: basic.organization_name ? name : `${name}${basic.credential ? `, ${basic.credential}` : ""}`,
          practice: basic.organization_name ? null : null,
          specialty: tax?.desc ?? null,
          address: addr ? titleCase(`${addr.address_1}${addr.address_2 ? ` ${addr.address_2}` : ""}, ${addr.city}, `) + (addr.state ?? "") + ` ${addr.postal_code?.slice(0, 5) ?? ""}` : null,
          phone: addr?.telephone_number ?? null,
          npi: r.number,
        });
      }
      if (found.length >= 8) break;
    } catch (e) {
      console.log("npi lookup failed:", (e as Error).message);
    }
  }
  return found.slice(0, 12);
}

/* ---------------- AI helper ---------------- */

async function ai(messages: unknown[]) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("AI is not configured on this project.");
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, response_format: { type: "json_object" } }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      res.status === 429
        ? "Too many requests right now — try again in a moment."
        : res.status === 402
        ? "AI credits are exhausted for this workspace."
        : `AI request failed (${res.status}): ${body.slice(0, 200)}`,
    );
  }
  const content = (await res.json()).choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content);
  } catch (_e) {
    const m = content.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : {};
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { text = "", location = "", insurance = "", demographics = null, family_history = null } = await req.json();
    if (!text.trim()) {
      return new Response(JSON.stringify({ providers: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Route the concern to a specialty + build search terms.
    const plan = await ai([
      {
        role: "system",
        content:
          "You route health concerns to the right kind of outpatient specialist, taking the person's age, sex, gender, heritage and family history into account where evidence supports it (for example a menopause sub-specialist, a geneticist for an ancestry-linked carrier risk, or earlier specialist referral because of family history). Reply with JSON only: " +
          '{"specialty":"plain-language specialty name","taxonomy":"official NPPES/NUCC taxonomy description, e.g. \\"Obstetrics & Gynecology\\", \\"Internal Medicine\\", \\"Dermatology\\", \\"Psychiatry & Neurology\\"",' +
          '"reason":"one short sentence for the patient","city":"","state":"two-letter code","postal":"","queries":["2-3 web searches that would surface named local providers with patient ratings and accepted insurance"]}. ' +
          "Parse city/state/postal from the location string; leave blank if absent. Include the location and, in one query, the insurance plan name.",
      },
      {
        role: "user",
        content: `Concern: ${text}\nLocation: ${location || "unspecified"}\nInsurance: ${insurance || "unspecified"}\n\n${demographicContext(demographics, family_history)}`,
      },
    ]);

    const specialty: string = plan.specialty ?? "Primary care";
    const taxonomy: string = plan.taxonomy ?? "Internal Medicine";
    const queries: string[] = Array.isArray(plan.queries) && plan.queries.length
      ? plan.queries.slice(0, 3)
      : [`${specialty} near ${location} ratings reviews`];

    // 2. Search the web and the official provider registry in parallel.
    const [hitLists, registry] = await Promise.all([
      Promise.all(queries.map((q: string) => webSearch(q, 6))),
      npiLookup(taxonomy, plan.city ?? "", plan.state ?? "", plan.postal ?? ""),
    ]);

    const seen = new Set<string>();
    const hits: SearchHit[] = [];
    for (const list of hitLists) {
      for (const h of list) {
        if (seen.has(h.url)) continue;
        seen.add(h.url);
        hits.push(h);
      }
    }

    // 3. Merge: registry providers are facts; web results supply ratings / insurance / practice names.
    const corpus = [
      "OFFICIAL PROVIDER REGISTRY (NPPES, authoritative — names, addresses and phones here are verified):",
      registry.length
        ? registry.map((r, i) => `R${i + 1} ${r.name} | ${r.specialty ?? ""} | ${r.address ?? ""} | ${r.phone ?? ""} | NPI ${r.npi}`).join("\n")
        : "(no registry matches)",
      "",
      "WEB SEARCH RESULTS:",
      hits.length ? hits.map((h, i) => `[${i + 1}] ${h.url}\n${h.snippet}`).join("\n\n") : "(none)",
    ].join("\n");

    const merged = await ai([
      {
        role: "system",
        content:
          "You assemble a shortlist of local healthcare providers from two sources: an authoritative government provider registry and raw web search results. " +
          "Use ONLY facts present in the supplied text. Never invent a name, address, phone, rating or insurance plan. Unknown fields must be null or []. " +
          'Reply with JSON only: {"providers":[{"name":"","practice":null,"specialty":"","address":null,"phone":null,"rating":null,"reviews":null,"insurance":[],"insurance_match":"confirmed|likely|unknown","source":"registry|web|both","source_url":null,"why":"one short sentence tying them to the concern"}],"sources":[{"title":"","url":""}],"note":null}. ' +
          "Prefer registry entries for identity fields; attach a rating (0-5 number), review count or insurance list only when the web text states it for that specific provider. " +
          "insurance_match is 'confirmed' only when the user's own plan is explicitly listed for that provider, 'likely' when the practice or health system is described as accepting most major plans, otherwise 'unknown'. " +
          "Return up to 6 providers, most relevant to the concern first. Set note when the sources were thin.",
      },
      {
        role: "user",
        content: `Concern: ${text}\nLocation: ${location || "unspecified"}\nUser's insurance: ${insurance || "unspecified"}\nSpecialty needed: ${specialty}\n\n${corpus}`,
      },
    ]);

    const providers = (Array.isArray(merged.providers) ? merged.providers : []).slice(0, 6).map((p: any) => {
      const q = [p.name, p.practice, location].filter(Boolean).join(" ");
      return {
        ...p,
        ratings_url: `https://www.google.com/search?q=${encodeURIComponent(`${q} reviews rating`)}`,
        insurance_url: `https://www.google.com/search?q=${encodeURIComponent(`${q} accepts ${insurance || "insurance"}`)}`,
        map_url: `https://www.google.com/maps/search/${encodeURIComponent(p.address ? `${p.name} ${p.address}` : q)}`,
      };
    });

    return new Response(
      JSON.stringify({
        specialty,
        reason: plan.reason ?? null,
        queries,
        providers,
        sources: (Array.isArray(merged.sources) && merged.sources.length
          ? merged.sources
          : hits.slice(0, 5).map((h) => ({ title: h.title, url: h.url }))
        ).slice(0, 6),
        registry_count: registry.length,
        note: merged.note ?? null,
        searched_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
