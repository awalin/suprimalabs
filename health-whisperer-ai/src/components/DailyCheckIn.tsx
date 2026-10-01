import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Flame, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

const MOODS = [
  { v: 1, emoji: "😣" },
  { v: 2, emoji: "😕" },
  { v: 3, emoji: "😐" },
  { v: 4, emoji: "🙂" },
  { v: 5, emoji: "😄" },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DailyCheckIn() {
  const { user } = useAuth();
  const { profile, update } = useProfile();
  const [mood, setMood] = useState<number | null>(null);
  const [sleep, setSleep] = useState([7]);
  const [energy, setEnergy] = useState([3]);
  const [saving, setSaving] = useState(false);
  const [doneToday, setDoneToday] = useState(false);

  useEffect(() => {
    if (profile?.last_checkin_date === todayStr()) setDoneToday(true);
  }, [profile]);

  const submit = async () => {
    if (!user || mood == null) return;
    setSaving(true);
    const body = `Daily check-in — mood ${mood}/5, slept ${sleep[0]}h, energy ${energy[0]}/5.`;
    const { error } = await supabase.from("entries").insert({
      user_id: user.id,
      body,
      mood,
      entry_type: "check_in",
      ai_data: { sleep_hours: sleep[0], energy: energy[0] } as any,
    });
    if (error) { setSaving(false); return toast.error(error.message); }

    // Streak logic
    const today = todayStr();
    const last = profile?.last_checkin_date;
    let streak = profile?.streak_count ?? 0;
    if (last === today) {
      // already counted
    } else {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      streak = last === yesterday ? streak + 1 : 1;
    }
    await update({ streak_count: streak, last_checkin_date: today });

    setSaving(false);
    setDoneToday(true);
    toast.success(streak > 1 ? `${streak}-day streak! 🔥` : "Checked in for today");
  };

  const reset = () => { setDoneToday(false); setMood(null); };

  if (doneToday) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6 flex items-center gap-3">
          <Check className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <div className="text-sm font-medium">You've checked in today</div>
            <div className="text-xs text-muted-foreground">Add as many check-ins as you like — mornings, evenings, flare-ups.</div>
          </div>
          <Button variant="outline" size="sm" onClick={reset}>Log another</Button>
          {(profile?.streak_count ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-orange-500 text-sm font-medium">
              <Flame className="h-4 w-4" /> {profile?.streak_count}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">15-second check-in</CardTitle>
            <CardDescription>Skip the full journal — just log how today feels.</CardDescription>
          </div>
          {(profile?.streak_count ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-orange-500 text-sm font-medium">
              <Flame className="h-4 w-4" /> {profile?.streak_count}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-xs text-muted-foreground mb-2">Mood</div>
          <div className="flex justify-between gap-2">
            {MOODS.map((m) => (
              <button
                key={m.v}
                onClick={() => setMood(m.v)}
                className={`flex-1 py-2 rounded-lg border text-2xl transition-colors ${
                  mood === m.v ? "border-primary bg-primary/10" : "border-input hover:bg-muted"
                }`}
                aria-label={`mood ${m.v}`}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Sleep last night</span>
            <span>{sleep[0]}h</span>
          </div>
          <Slider value={sleep} onValueChange={setSleep} min={0} max={12} step={0.5} />
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Energy today</span>
            <span>{energy[0]}/5</span>
          </div>
          <Slider value={energy} onValueChange={setEnergy} min={1} max={5} step={1} />
        </div>
        <Button onClick={submit} disabled={mood == null || saving} className="w-full">
          {saving ? "Saving…" : "Check in"}
        </Button>
      </CardContent>
    </Card>
  );
}
