import { corsHeaders } from "../_shared/cors.ts";
import { demographicContext, pubmedSearch, sanitizeReferences } from "../_shared/evidence.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { text, history, profile, demographics, family_history } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "missing LOVABLE_API_KEY" }), { status: 500, headers: corsHeaders });

    const system = `You are a supportive health journaling assistant. The user writes freely about how they feel, doctor visits, symptoms, or emotions.

Your job:
1. Extract structured medical info conservatively (only what's clearly mentioned).
2. Reflect on the user's EMOTIONAL state with empathy — name the feeling and offer a brief grounding suggestion (1-2 sentences).
3. Suggest the type of specialist that may be relevant (e.g., "Cardiologist", "Therapist", "Primary care"). If unclear, suggest primary care.
4. Offer 2-4 short, personalized recommendations using the user's prior history and family history when provided.
5. Build a short Google Maps search query for nearby providers (e.g., "Cardiologist near me accepting Aetna").
6. EXTRACT SCHEDULE ITEMS: any appointment, exercise session, or medication schedule mentioned with a date/time or recurrence. Use ISO 8601 for start_at. For recurring items, build a valid iCalendar RRULE (e.g. "FREQ=WEEKLY;BYDAY=MO,WE,FR"). Today's date is ${new Date().toISOString().slice(0, 10)} — resolve relative phrases like "Tuesday 2pm" or "every Monday" against it. Skip items with no time information.

7. TAILOR EVERYTHING to the person's self-reported age, sex, gender, heritage/ancestry and family history when supplied — say which part of their context drove a recommendation (e.g. "because a first-degree relative had it, guidelines move this screening earlier").
8. EVIDENCE: set "evidence_query" to a concise clinical search phrase covering the main concern plus the relevant demographic modifier (e.g. "perimenopause vasomotor symptoms management women 40-45"). In "references", list only real, stable pages from peer-reviewed literature or recognised authorities: PubMed/PMC, Cochrane, JAMA/NEJM/Lancet/BMJ, MedlinePlus, NIH institutes, CDC, FDA, WHO, USPSTF, ACOG, AHA, ADA, The Menopause Society, Mayo Clinic, Cleveland Clinic, Johns Hopkins. NEVER cite a personal blog, forum, wellness site, news article or commercial product page, and never invent a URL — if unsure of the exact page, use that source's topic page.

Never diagnose. Be warm, plain-language, non-judgmental.`;

    const userMsg = `JOURNAL ENTRY:
${text}

${profile ? `USER PROFILE (insurance, mood, family history if present): ${JSON.stringify(profile)}` : ""}
${history ? `RECENT HISTORY (last entries, meds): ${JSON.stringify(history)}` : ""}

${demographicContext(demographics ?? profile?.demographics, family_history ?? profile?.family_history)}

If family history is provided, weave it into recommendations when relevant (e.g. earlier screening for conditions that run in the family).`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
        tools: [{
          type: "function",
          function: {
            name: "save_entry",
            description: "Save parsed health journal entry and return supportive suggestions",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "1-2 sentence neutral summary" },
                mood: { type: "integer", description: "1-5 scale, 5 best" },
                emotion: { type: "string", description: "single word for the dominant feeling (e.g. anxious, hopeful, exhausted)" },
                emotional_support: { type: "string", description: "1-2 warm, empathetic sentences acknowledging the feeling + a small grounding suggestion" },
                symptoms: { type: "array", items: { type: "string" } },
                doctor: { type: "string" },
                visit_type: { type: "string" },
                suggested_specialist: { type: "string", description: "type of doctor the user may benefit from seeing" },
                recommendations: {
                  type: "array",
                  description: "2-4 short, personalized, actionable suggestions",
                  items: { type: "string" },
                },
                demographic_rationale: {
                  type: "string",
                  description: "1-2 sentences naming which parts of the person's age, sex, heritage or family history shaped these suggestions. Omit ancestry unless real population-level evidence links it to this concern.",
                },
                evidence_query: {
                  type: "string",
                  description: "concise clinical literature search phrase for this concern plus the relevant demographic modifier",
                },
                references: {
                  type: "array",
                  description: "peer-reviewed or authoritative sources supporting the recommendations. No blogs, forums or commercial sites.",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      url: { type: "string" },
                      journal: { type: "string" },
                      year: { type: "integer" },
                    },
                    required: ["title", "url"],
                  },
                },
                nearby_search_query: { type: "string", description: "ready-to-paste search like 'Cardiologist near me accepting Aetna'" },
                urgency: { type: "string", enum: ["routine", "soon", "urgent"], description: "soon = within days; urgent = seek care today/ER" },
                medications: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      dose: { type: "string" },
                      schedule: { type: "string" },
                      purpose: { type: "string" },
                    },
                    required: ["name"],
                  },
                },
                schedule_items: {
                  type: "array",
                  description: "Appointments, workouts, or medication reminders with date/time. Skip if no time is mentioned.",
                  items: {
                    type: "object",
                    properties: {
                      kind: { type: "string", enum: ["appointment", "exercise", "medication", "other"] },
                      title: { type: "string" },
                      start_at: { type: "string", description: "ISO 8601 datetime" },
                      end_at: { type: "string", description: "ISO 8601 datetime, optional" },
                      all_day: { type: "boolean" },
                      location: { type: "string" },
                      notes: { type: "string" },
                      recurrence_rule: { type: "string", description: "iCalendar RRULE without prefix, e.g. FREQ=WEEKLY;BYDAY=MO,WE" },
                    },
                    required: ["kind", "title", "start_at"],
                  },
                },
              },
              required: ["summary", "emotional_support", "suggested_specialist", "recommendations"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_entry" } },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: "ai gateway", detail: t }), { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await res.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = call ? JSON.parse(call.function.arguments) : {};

    // Only allowlisted sources survive; top up with real PubMed records for this concern.
    const cited = sanitizeReferences(args.references);
    const literature = await pubmedSearch(args.evidence_query || args.suggested_specialist || text.slice(0, 180), 4);
    const seen = new Set(cited.map((r) => r.url));
    args.references = [...cited, ...literature.filter((r) => !seen.has(r.url))].slice(0, 8);
    args.evidence_note =
      "Sources are limited to peer-reviewed literature and recognised health authorities. Educational only — not medical advice.";

    return new Response(JSON.stringify(args), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
