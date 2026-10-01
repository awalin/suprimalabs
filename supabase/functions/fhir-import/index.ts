import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

type Bundle = { entry?: { resource?: any }[] };

async function fhirGet(base: string, path: string, token?: string): Promise<Bundle | any> {
  const url = `${base.replace(/\/$/, "")}/${path}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/fhir+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`[${res.status}] ${url} — ${text.slice(0, 400)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response from ${url}`);
  }
}

const resources = (b: Bundle | any): any[] => (b?.entry ?? []).map((e: any) => e.resource).filter(Boolean);

const codeText = (c: any): string | null =>
  c?.text ?? c?.coding?.[0]?.display ?? c?.coding?.[0]?.code ?? null;

const humanName = (p: any): string | null => {
  const n = p?.name?.[0];
  if (!n) return null;
  return n.text ?? ([n.given?.join(" "), n.family].filter(Boolean).join(" ") || null);
};

function refRange(o: any): string | null {
  const r = o?.referenceRange?.[0];
  if (!r) return null;
  if (r.text) return r.text;
  const lo = r.low?.value, hi = r.high?.value, u = r.low?.unit ?? r.high?.unit ?? "";
  if (lo != null && hi != null) return `${lo}–${hi} ${u}`.trim();
  if (lo != null) return `> ${lo} ${u}`.trim();
  if (hi != null) return `< ${hi} ${u}`.trim();
  return null;
}

const obsTime = (o: any): string | null =>
  o?.effectiveDateTime ?? o?.effectivePeriod?.start ?? o?.issued ?? null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization header" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Invalid session" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const fhirBase: string = String(body.fhir_base_url ?? "").trim();
    const patientId: string = String(body.patient_id ?? "").trim();
    const token: string | undefined = body.access_token || undefined;
    const dryRun: boolean = body.dry_run === true;
    const provider: string = String(body.provider_name ?? "EHR").trim() || "EHR";

    if (!/^https:\/\//i.test(fhirBase)) return json({ error: "fhir_base_url must be an https URL" }, 400);
    if (!patientId) return json({ error: "patient_id required" }, 400);

    const sb = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const q = `patient=${encodeURIComponent(patientId)}`;
    const [patient, medsB, condB, encB, labB, vitalB] = await Promise.all([
      fhirGet(fhirBase, `Patient/${encodeURIComponent(patientId)}`, token).catch(() => null),
      fhirGet(fhirBase, `MedicationRequest?${q}&_count=100`, token).catch(() => ({})),
      fhirGet(fhirBase, `Condition?${q}&_count=100`, token).catch(() => ({})),
      fhirGet(fhirBase, `Encounter?${q}&_count=50`, token).catch(() => ({})),
      fhirGet(fhirBase, `Observation?${q}&category=laboratory&_count=200`, token).catch(() => ({})),
      fhirGet(fhirBase, `Observation?${q}&category=vital-signs&_count=200`, token).catch(() => ({})),
    ]);

    // ---- medications
    const medRows = resources(medsB).map((m) => {
      const dosage = m.dosageInstruction?.[0];
      const dose = dosage?.doseAndRate?.[0]?.doseQuantity;
      return {
        user_id: userId,
        name: codeText(m.medicationCodeableConcept) ?? m.medicationReference?.display ?? "Medication",
        dose: dose ? `${dose.value ?? ""} ${dose.unit ?? ""}`.trim() || null : null,
        schedule: dosage?.text ?? dosage?.timing?.code?.text ?? null,
        purpose: codeText(m.reasonCode?.[0]) ?? null,
        started_on: (m.authoredOn ?? "").slice(0, 10) || null,
        ended_on: m.status === "completed" || m.status === "stopped"
          ? (m.dispenseRequest?.validityPeriod?.end ?? "").slice(0, 10) || null
          : null,
        notes: `Imported from ${provider} · status ${m.status ?? "unknown"}`,
        external_provider: "fhir",
        external_id: `MedicationRequest/${m.id}`,
      };
    });

    // ---- labs
    const labRows = resources(labB)
      .filter((o) => o.valueQuantity || o.valueString || o.valueCodeableConcept)
      .map((o) => ({
        user_id: userId,
        name: codeText(o.code) ?? "Lab result",
        code: o.code?.coding?.[0]?.code ?? null,
        value: typeof o.valueQuantity?.value === "number" ? o.valueQuantity.value : null,
        value_text: o.valueString ?? codeText(o.valueCodeableConcept) ?? null,
        unit: o.valueQuantity?.unit ?? null,
        reference_range: refRange(o),
        interpretation: codeText(o.interpretation?.[0]) ?? null,
        observed_at: obsTime(o),
        panel: null,
        source: "ehr",
        external_provider: "fhir",
        external_id: `Observation/${o.id}`,
      }));

    // ---- vitals
    const VITAL_MAP: Record<string, string> = {
      "8867-4": "heart_rate",
      "8480-6": "bp_systolic",
      "8462-4": "bp_diastolic",
      "29463-7": "weight",
      "8302-2": "height",
      "39156-5": "bmi",
      "2708-6": "oxygen_saturation",
      "8310-5": "temperature",
    };
    const vitalRows: any[] = [];
    for (const o of resources(vitalB)) {
      const push = (loinc: string, vq: any, id: string) => {
        const type = VITAL_MAP[loinc];
        if (!type || typeof vq?.value !== "number") return;
        vitalRows.push({
          user_id: userId,
          type,
          value: vq.value,
          unit: vq.unit ?? null,
          recorded_at: obsTime(o) ?? new Date().toISOString(),
          source: "ehr",
          note: `Imported from ${provider}`,
          external_provider: "fhir",
          external_id: id,
        });
      };
      const topCode = o.code?.coding?.[0]?.code;
      if (o.valueQuantity && topCode) push(topCode, o.valueQuantity, `Observation/${o.id}`);
      for (const c of o.component ?? []) {
        const cc = c.code?.coding?.[0]?.code;
        if (cc) push(cc, c.valueQuantity, `Observation/${o.id}#${cc}`);
      }
    }

    // ---- visits & diagnoses -> timeline entries
    const conditions = resources(condB);
    const conditionNames = conditions.map((c) => codeText(c.code)).filter(Boolean) as string[];
    const encRows = resources(encB)
      .filter((e) => e.period?.start ?? e.period?.end)
      .map((e) => {
        const when = e.period?.start ?? e.period?.end;
        const type = codeText(e.type?.[0]) ?? e.class?.display ?? "Visit";
        const doctor = e.participant?.[0]?.individual?.display ?? null;
        const diagnoses = (e.reasonCode ?? []).map(codeText).filter(Boolean) as string[];
        const lines = [
          `${type}${e.serviceProvider?.display ? ` at ${e.serviceProvider.display}` : ""}`,
          doctor ? `Clinician: ${doctor}` : null,
          diagnoses.length ? `Reason: ${diagnoses.join(", ")}` : null,
          `Imported from ${provider} — provider record, read-only.`,
        ].filter(Boolean);
        return {
          user_id: userId,
          entry_date: when,
          body: lines.join("\n"),
          visit_type: type,
          doctor,
          entry_type: "ehr_visit",
          ai_summary: `${type}${when ? ` on ${String(when).slice(0, 10)}` : ""}`,
          symptoms: diagnoses.length ? diagnoses : null,
          external_provider: "fhir",
          external_id: `Encounter/${e.id}`,
        };
      });

    const summary = {
      patient: patient ? { id: patient.id, name: humanName(patient), birth_date: patient.birthDate ?? null, gender: patient.gender ?? null } : null,
      counts: {
        medications: medRows.length,
        visits: encRows.length,
        diagnoses: conditionNames.length,
        labs: labRows.length,
        vitals: vitalRows.length,
      },
      diagnoses: conditionNames.slice(0, 25),
      preview: {
        medications: medRows.slice(0, 8).map((m) => ({ name: m.name, dose: m.dose, schedule: m.schedule })),
        visits: encRows.slice(0, 8).map((e) => ({ date: e.entry_date, type: e.visit_type, doctor: e.doctor })),
        labs: labRows.slice(0, 10).map((l) => ({ name: l.name, value: l.value ?? l.value_text, unit: l.unit, observed_at: l.observed_at })),
      },
    };

    if (dryRun) return json({ dry_run: true, ...summary });

    const upsert = async (table: string, rows: any[]) => {
      if (!rows.length) return 0;
      const { error } = await sb.from(table).upsert(rows, {
        onConflict: "user_id,external_provider,external_id",
        ignoreDuplicates: false,
      });
      if (error) throw new Error(`${table}: ${error.message}`);
      return rows.length;
    };

    await upsert("medications", medRows);
    await upsert("lab_results", labRows);
    await upsert("vitals", vitalRows);
    await upsert("entries", encRows);

    if (conditionNames.length) {
      const { data: prof } = await sb.from("profiles").select("demographics").eq("id", userId).maybeSingle();
      const demographics = { ...(prof?.demographics ?? {}), ehr_conditions: conditionNames.slice(0, 40) };
      await sb.from("profiles").update({ demographics }).eq("id", userId);
    }

    if (body.connection_id) {
      await sb.from("ehr_connections")
        .update({ last_synced_at: new Date().toISOString(), patient_name: summary.patient?.name ?? null })
        .eq("id", body.connection_id).eq("user_id", userId);
    }

    return json({ imported: true, ...summary });
  } catch (e) {
    console.error("fhir-import failed:", e);
    return json({ error: String(e instanceof Error ? e.message : e) }, 500);
  }
});
