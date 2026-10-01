import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CalendarClock, HeartHandshake, Loader2, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

type Item = {
  id: string;
  title: string;
  kind: string;
  start_at: string | null;
  end_at: string | null;
  location: string | null;
  prep_questions: any;
  prep_prompted_at: string | null;
  reflection_prompted_at: string | null;
  reflection_entry_id: string | null;
};

const MOODS = [
  { v: 1, emoji: "😣", label: "Dismissed" },
  { v: 2, emoji: "😕", label: "Rushed" },
  { v: 3, emoji: "😐", label: "Neutral" },
  { v: 4, emoji: "🙂", label: "Heard" },
  { v: 5, emoji: "😄", label: "Great" },
];

const SELECT =
  "id,title,kind,start_at,end_at,location,prep_questions,prep_prompted_at,reflection_prompted_at,reflection_entry_id";

export default function AppointmentPrompts() {
  const { user } = useAuth();
  const [prep, setPrep] = useState<Item | null>(null);
  const [reflect, setReflect] = useState<Item | null>(null);

  const load = async () => {
    if (!user) return;
    const now = Date.now();
    const { data } = await supabase
      .from("schedule_items")
      .select(SELECT)
      .eq("kind", "appointment")
      .gte("start_at", new Date(now - 14 * 86400000).toISOString())
      .lte("start_at", new Date(now + 14 * 86400000).toISOString())
      .order("start_at", { ascending: true });

    const items = (data ?? []) as Item[];

    // Pre-visit: soonest appointment starting within the next 2 days that has no saved questions.
    const upcoming = items.find((i) => {
      if (!i.start_at) return false;
      const t = new Date(i.start_at).getTime();
      return t > now && t - now <= 2 * 86400000 && !(i.prep_questions?.questions?.length);
    });

    // Post-visit: most recent appointment that has ended in the last 7 days with no reflection yet.
    const past = [...items].reverse().find((i) => {
      if (!i.start_at || i.reflection_entry_id) return false;
      const end = new Date(i.end_at ?? i.start_at).getTime();
      return end < now && now - end <= 7 * 86400000;
    });

    setPrep(upcoming ?? null);
    setReflect(past ?? null);
  };

  useEffect(() => { load(); }, [user]);

  if (!prep && !reflect) return null;

  return (
    <div className="space-y-4">
      {reflect && <ReflectCard item={reflect} onDone={() => { setReflect(null); load(); }} />}
      {prep && <PrepCard item={prep} onDone={() => { setPrep(null); load(); }} />}
    </div>
  );
}

/* ---------------- Pre-visit: what do you want to ask? ---------------- */

function PrepCard({ item, onDone }: { item: Item; onDone: () => void }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<string[]>(item.prep_questions?.questions ?? []);
  const [draft, setDraft] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const start = item.start_at ? new Date(item.start_at) : null;
  const hoursAway = start ? Math.max(0, Math.round((start.getTime() - Date.now()) / 3600000)) : 0;
  const whenLabel = hoursAway >= 24 ? `in ${Math.round(hoursAway / 24)} day(s)` : `in ${hoursAway} hour(s)`;

  const add = (q: string) => {
    const v = q.trim();
    if (!v) return;
    setQuestions((qs) => (qs.includes(v) ? qs : [...qs, v]));
    setDraft("");
  };

  const suggest = async () => {
    if (!user) return;
    setSuggesting(true);
    const { data, error } = await supabase.functions.invoke("appointment-brief", {
      body: { user_id: user.id, schedule_item_id: item.id },
    });
    setSuggesting(false);
    if (error) return toast.error(error.message);
    const suggested: string[] = (data as any)?.brief?.questions ?? [];
    if (!suggested.length) return toast.info("No suggestions yet — add a few entries first");
    setQuestions((qs) => [...qs, ...suggested.filter((s) => !qs.includes(s))]);
  };

  const save = async () => {
    if (!questions.length) return toast.error("Add at least one question");
    setSaving(true);
    const { error } = await supabase
      .from("schedule_items")
      .update({
        prep_questions: { questions, saved_at: new Date().toISOString() } as any,
        prep_prompted_at: new Date().toISOString(),
      })
      .eq("id", item.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved — you'll find these in Prep and on the Schedule");
    onDone();
  };

  const skip = async () => {
    await supabase.from("schedule_items").update({ prep_prompted_at: new Date().toISOString() }).eq("id", item.id);
    setDismissed(true);
    onDone();
  };

  if (dismissed) return null;

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              {item.title} is {whenLabel}
            </CardTitle>
            <CardDescription>
              {start && start.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              {item.location ? ` · ${item.location}` : ""} — what do you want to ask?
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={skip} aria-label="Dismiss"><X className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {questions.length > 0 && (
          <ol className="space-y-1.5 text-sm">
            {questions.map((q, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary font-medium">{i + 1}.</span>
                <span className="flex-1">{q}</span>
                <button
                  onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Remove question"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ol>
        )}

        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(draft); } }}
            placeholder="e.g. Should we recheck my ferritin before deciding on the IUD?"
          />
          <Button variant="outline" size="icon" onClick={() => add(draft)} aria-label="Add question">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={suggest} disabled={suggesting}>
            {suggesting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
            Suggest from my history
          </Button>
          <Button size="sm" onClick={save} disabled={saving || !questions.length}>
            {saving ? "Saving…" : "Save my questions"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- Post-visit: how did it feel? ---------------- */

function ReflectCard({ item, onDone }: { item: Item; onDone: () => void }) {
  const { user } = useAuth();
  const [mood, setMood] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const start = item.start_at ? new Date(item.start_at) : null;

  const save = async () => {
    if (!user || mood == null) return toast.error("Pick how the visit felt");
    setSaving(true);
    const body =
      `Reflection on ${item.title}${start ? ` (${start.toLocaleDateString(undefined, { dateStyle: "medium" })})` : ""}: ` +
      `felt ${MOODS.find((m) => m.v === mood)?.label.toLowerCase()}.` + (text.trim() ? `\n\n${text.trim()}` : "");

    const { data: entry, error } = await supabase
      .from("entries")
      .insert({
        user_id: user.id,
        body,
        mood,
        entry_type: "visit_reflection",
        visit_type: item.title,
        ai_data: { schedule_item_id: item.id, visit_feeling: MOODS.find((m) => m.v === mood)?.label } as any,
      })
      .select("id")
      .single();
    if (error || !entry) { setSaving(false); return toast.error(error?.message ?? "Could not save"); }

    await supabase
      .from("schedule_items")
      .update({ reflection_entry_id: entry.id, reflection_prompted_at: new Date().toISOString() })
      .eq("id", item.id);

    setSaving(false);
    toast.success("Saved to your timeline");
    onDone();
  };

  const skip = async () => {
    await supabase.from("schedule_items").update({ reflection_prompted_at: new Date().toISOString() }).eq("id", item.id);
    onDone();
  };

  return (
    <Card className="border-accent">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-primary" />
              How did {item.title} go?
            </CardTitle>
            <CardDescription>
              {start && start.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} — a couple of lines
              now is worth a lot at your next visit.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={skip} aria-label="Dismiss"><X className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
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
              <span className="text-[11px] text-muted-foreground">{m.label}</span>
            </button>
          ))}
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What did they say? Did you get to ask your questions? Anything left unanswered or unsettling?"
          className="min-h-[90px] resize-none"
        />
        <Button size="sm" onClick={save} disabled={saving || mood == null}>
          {saving ? "Saving…" : "Save reflection"}
        </Button>
      </CardContent>
    </Card>
  );
}
