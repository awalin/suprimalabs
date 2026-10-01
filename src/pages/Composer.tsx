import SpecialistSidebar from "@/components/SpecialistSidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Sparkles, Camera, Heart, Stethoscope, MapPin, Lightbulb, AlertTriangle, CalendarClock } from "lucide-react";
import AddToCalendar from "@/components/AddToCalendar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import DailyCheckIn from "@/components/DailyCheckIn";
import FamilyHistoryCard from "@/components/FamilyHistoryCard";
import DemographicsCard from "@/components/DemographicsCard";
import UpcomingBanner from "@/components/UpcomingBanner";
import AppointmentPrompts from "@/components/AppointmentPrompts";

type ScheduleItem = {
  kind: "appointment" | "exercise" | "medication" | "other";
  title: string;
  start_at: string;
  end_at?: string;
  all_day?: boolean;
  location?: string;
  notes?: string;
  recurrence_rule?: string;
};

type Parsed = {
  summary?: string;
  mood?: number;
  emotion?: string;
  emotional_support?: string;
  symptoms?: string[];
  doctor?: string;
  visit_type?: string;
  suggested_specialist?: string;
  recommendations?: string[];
  demographic_rationale?: string;
  references?: { title: string; source: string; url: string; kind?: string; year?: number | null; journal?: string | null }[];
  evidence_note?: string;
  nearby_search_query?: string;
  urgency?: "routine" | "soon" | "urgent";
  medications?: { name: string; dose?: string; schedule?: string; purpose?: string }[];
  schedule_items?: ScheduleItem[];
};

const MOODS = [
  { v: 1, emoji: "😣", label: "Awful" },
  { v: 2, emoji: "😕", label: "Low" },
  { v: 3, emoji: "😐", label: "Okay" },
  { v: 4, emoji: "🙂", label: "Good" },
  { v: 5, emoji: "😄", label: "Great" },
];

export default function Composer() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [insurance, setInsurance] = useState<string>(() => localStorage.getItem("pj_insurance") ?? "");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { localStorage.setItem("pj_insurance", insurance); }, [insurance]);

  const handleParse = async () => {
    if (!text.trim()) return;
    setParsing(true);

    // Fetch a bit of history to ground suggestions
    let history: any = null;
    if (user) {
      const [{ data: entries }, { data: meds }] = await Promise.all([
        supabase.from("entries").select("ai_summary,symptoms,doctor,visit_type,mood,created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("medications").select("name,dose,purpose").limit(10),
      ]);
      history = { recent_entries: entries ?? [], medications: meds ?? [] };
    }

    const profileBody = { insurance: insurance || undefined, current_mood: mood ?? undefined, family_history: profile?.family_history ?? undefined, demographics: profile?.demographics ?? undefined };

    const { data, error } = await supabase.functions.invoke("parse-entry", { body: { text, history, profile: profileBody, demographics: profile?.demographics ?? undefined, family_history: profile?.family_history ?? undefined } });
    setParsing(false);
    if (error) return toast.error(error.message);
    setParsed(data);
    if (typeof data?.mood === "number" && mood == null) setMood(data.mood);
  };

  const handleSave = async () => {
    if (!user || !text.trim()) return;
    setSaving(true);

    // Auto-parse if the user hasn't clicked "AI parse" yet so we can extract meds, etc.
    let p: Parsed = parsed ?? {};
    if (!parsed) {
      const { data, error } = await supabase.functions.invoke("parse-entry", { body: { text } });
      if (!error && data) {
        p = data as Parsed;
        setParsed(p);
      }
    }
    const { data: entry, error } = await supabase
      .from("entries")
      .insert({
        user_id: user.id,
        body: text,
        mood: mood ?? p.mood ?? null,
        symptoms: p.symptoms ?? null,
        doctor: p.doctor ?? null,
        visit_type: p.visit_type ?? null,
        ai_summary: p.summary ?? null,
        ai_data: p as any,
      })
      .select()
      .single();

    if (error) { setSaving(false); return toast.error(error.message); }

    if (p.medications?.length) {
      for (const m of p.medications) {
        const { data: med } = await supabase
          .from("medications")
          .insert({ user_id: user.id, name: m.name, dose: m.dose, schedule: m.schedule, purpose: m.purpose })
          .select()
          .single();
        if (med) await supabase.from("entry_medications").insert({ entry_id: entry.id, medication_id: med.id });
      }
    }

    let scheduledCount = 0;
    if (p.schedule_items?.length) {
      const rows = p.schedule_items
        .filter((s) => s.title && s.start_at)
        .map((s) => ({
          user_id: user.id,
          entry_id: entry.id,
          kind: s.kind ?? "appointment",
          title: s.title,
          start_at: s.start_at,
          end_at: s.end_at ?? null,
          all_day: !!s.all_day,
          location: s.location ?? null,
          notes: s.notes ?? null,
          recurrence_rule: s.recurrence_rule ?? null,
          source: "parsed",
        }));
      if (rows.length) {
        const { error: schedErr } = await supabase.from("schedule_items").insert(rows);
        if (!schedErr) scheduledCount = rows.length;
      }
    }

    setSaving(false);
    toast.success(scheduledCount > 0 ? `Saved · ${scheduledCount} added to schedule` : "Saved to your journal");
    setText(""); setParsed(null); setMood(null);
    if (scheduledCount > 0) navigate("/schedule");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("health-attachments").upload(path, file);
    if (upErr) { setUploading(false); return toast.error(upErr.message); }

    const { data, error } = await supabase.functions.invoke("image-extract", { body: { storage_path: path, kind: "prescription" } });
    setUploading(false);
    if (error) return toast.error(error.message);

    await supabase.from("attachments").insert({ user_id: user.id, storage_path: path, kind: "prescription", ai_extracted: data });

    const append = `\n\n[From uploaded image] ${data?.summary ?? JSON.stringify(data?.fields ?? data)}`;
    setText((t) => t + append);
    toast.success("Image processed — added to entry");
  };

  const nearbyUrl = parsed?.nearby_search_query
    ? `https://www.google.com/maps/search/${encodeURIComponent(parsed.nearby_search_query)}`
    : null;

  const urgencyTone =
    parsed?.urgency === "urgent" ? "border-destructive/50 bg-destructive/5" :
    parsed?.urgency === "soon" ? "border-orange-500/50 bg-orange-500/5" : "";

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="max-w-2xl w-full space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">How are you feeling?</h1>
        <p className="text-sm text-muted-foreground">
          Write freely about your day, a doctor visit, symptoms, or your emotions. We'll listen and suggest gentle next steps.
        </p>
      </div>

      <UpcomingBanner />
      <AppointmentPrompts />
      <DailyCheckIn />
      <DemographicsCard />
      <FamilyHistoryCard />

      {/* Mood check-in */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Quick emotional check-in</span>
          </div>
          <div className="flex justify-between gap-2">
            {MOODS.map((m) => (
              <button
                key={m.v}
                onClick={() => setMood(m.v)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border transition-colors ${
                  mood === m.v ? "border-primary bg-primary/10" : "border-input hover:bg-muted"
                }`}
                aria-label={m.label}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Entry */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Saw Dr. Patel for my annual checkup today. She mentioned my blood pressure was a bit high. I felt anxious going in — my dad had heart issues at this age — but a little relieved after…"
            className="min-h-[200px] resize-none"
          />
          <Input
            value={insurance}
            onChange={(e) => setInsurance(e.target.value)}
            placeholder="Insurance (optional, e.g. Aetna) — used to find nearby providers"
          />
          <div className="flex flex-wrap gap-2 justify-between">
            <label className="inline-flex items-center gap-2 text-sm px-3 py-2 border rounded-md cursor-pointer hover:bg-muted">
              <Camera className="h-4 w-4" />
              {uploading ? "Reading…" : "Add photo (Rx, lab, note)"}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={handleParse} disabled={!text.trim() || parsing}>
                {parsing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Get suggestions
              </Button>
              <Button onClick={handleSave} disabled={!text.trim() || saving}>
                {saving ? "Saving…" : "Save entry"}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Suggestions use your past entries and meds to feel personal. This isn't medical advice.
          </p>
        </CardContent>
      </Card>

      {parsed && (
        <div className="space-y-3">
          {parsed.urgency && parsed.urgency !== "routine" && (
            <Card className={urgencyTone}>
              <CardContent className="pt-6 flex gap-3 text-sm">
                <AlertTriangle className={`h-5 w-5 ${parsed.urgency === "urgent" ? "text-destructive" : "text-orange-500"}`} />
                <div>
                  <div className="font-medium capitalize">{parsed.urgency} attention suggested</div>
                  <div className="text-muted-foreground">
                    {parsed.urgency === "urgent"
                      ? "Some of what you described may need same-day care. Consider calling your provider or visiting urgent care."
                      : "Worth booking a visit in the next few days."}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {parsed.emotional_support && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  How you're feeling
                </CardTitle>
                {parsed.emotion && <CardDescription className="capitalize">Sounds like: {parsed.emotion}</CardDescription>}
              </CardHeader>
              <CardContent className="text-sm leading-relaxed">{parsed.emotional_support}</CardContent>
            </Card>
          )}

          {parsed.suggested_specialist && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  Who you might see
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Badge variant="secondary" className="text-sm">{parsed.suggested_specialist}</Badge>
                {nearbyUrl && (
                  <a href={nearbyUrl} target="_blank" rel="noreferrer"
                     className="inline-flex items-center gap-2 text-primary hover:underline">
                    <MapPin className="h-4 w-4" />
                    Find nearby{insurance ? ` (accepts ${insurance})` : ""}
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {parsed.recommendations && parsed.recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Personalized suggestions
                </CardTitle>
                <CardDescription>Based on what you wrote, your past entries, and the age, sex, heritage and family history you shared.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {parsed.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>

                {parsed.demographic_rationale && (
                  <div className="mt-4 rounded-md bg-muted/60 p-3 text-sm leading-relaxed">
                    <span className="font-medium">Why these, for you: </span>
                    {parsed.demographic_rationale}
                  </div>
                )}

                {parsed.references && parsed.references.length > 0 && (
                  <div className="mt-4 border-t pt-3">
                    <div className="text-xs font-medium text-muted-foreground mb-2">References</div>
                    <ul className="space-y-2">
                      {parsed.references.map((r, i) => (
                        <li key={i} className="text-xs leading-snug">
                          <a href={r.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            {r.title}
                          </a>
                          <span className="text-muted-foreground">
                            {" — "}{r.source}
                            {r.journal ? `, ${r.journal}` : ""}
                            {r.year ? ` (${r.year})` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      {parsed.evidence_note ??
                        "Sources are limited to peer-reviewed literature and recognised health authorities."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {parsed.schedule_items && parsed.schedule_items.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  Add to your calendar
                </CardTitle>
                <CardDescription>We spotted these in what you wrote. They'll be saved to your Schedule on save.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {parsed.schedule_items.map((s, i) => {
                  const start = new Date(s.start_at);
                  const valid = !isNaN(start.getTime());
                  return (
                    <div key={i} className="flex items-center justify-between gap-2 border-b last:border-0 pb-2 last:pb-0">
                      <div className="text-sm">
                        <div className="font-medium">{s.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {valid ? start.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : s.start_at}
                          {s.recurrence_rule && " · repeats"}
                          {s.location && ` · ${s.location}`}
                        </div>
                      </div>
                      {valid && (
                        <AddToCalendar
                          event={{
                            uid: `pulse-${Date.now()}-${i}@pulse.local`,
                            title: s.title,
                            start,
                            end: s.end_at ? new Date(s.end_at) : undefined,
                            allDay: s.all_day,
                            location: s.location,
                            description: s.notes,
                            rrule: s.recurrence_rule,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {(parsed.summary || parsed.symptoms?.length || parsed.medications?.length) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">What we captured</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {parsed.summary && <p>{parsed.summary}</p>}
                <div className="flex flex-wrap gap-2">
                  {parsed.doctor && <Badge variant="secondary">Dr: {parsed.doctor}</Badge>}
                  {parsed.visit_type && <Badge variant="secondary">{parsed.visit_type}</Badge>}
                  {parsed.symptoms?.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                </div>
                {parsed.medications && parsed.medications.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Medications</div>
                    <ul className="space-y-1">
                      {parsed.medications.map((m, i) => (
                        <li key={i}>• {m.name} {m.dose && `— ${m.dose}`} {m.schedule && `· ${m.schedule}`}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
      </div>

      <SpecialistSidebar
        text={text}
        insurance={insurance}
        demographics={profile?.demographics ?? null}
        familyHistory={profile?.family_history ?? null}
      />
    </div>
  );
}
