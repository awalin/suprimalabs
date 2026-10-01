import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/useProfile";
import { Users, Check, Pencil } from "lucide-react";
import { toast } from "sonner";

const COMMON = [
  "Heart disease",
  "High blood pressure",
  "Diabetes",
  "Cancer",
  "Stroke",
  "Mental health",
  "Asthma",
  "Thyroid",
];

export default function FamilyHistoryCard() {
  const { profile, update } = useProfile();
  const [editing, setEditing] = useState(false);
  const [conditions, setConditions] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.family_history) {
      setConditions(profile.family_history.conditions ?? []);
      setNotes(profile.family_history.notes ?? "");
    }
  }, [profile]);

  if (!profile) return null;
  const hasHistory = !!profile.family_history && ((profile.family_history.conditions?.length ?? 0) > 0 || !!profile.family_history.notes);

  const toggle = (c: string) =>
    setConditions((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));

  const save = async () => {
    setSaving(true);
    const { error } = await update({ family_history: { conditions, notes } as any });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Family history saved");
    setEditing(false);
  };

  if (!editing && hasHistory) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Family history
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {profile.family_history?.conditions?.map((c) => (
              <Badge key={c} variant="secondary">{c}</Badge>
            ))}
          </div>
          {profile.family_history?.notes && (
            <p className="text-sm text-muted-foreground mt-2">{profile.family_history.notes}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!editing && !hasHistory) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Tell us about your family history
          </CardTitle>
          <CardDescription>
            We'll use it to make suggestions more personal. Skip if you'd rather not — you can add it later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="sm" onClick={() => setEditing(true)}>Add family history</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Family history
        </CardTitle>
        <CardDescription>Anything that runs in your family?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {COMMON.map((c) => {
            const on = conditions.includes(c);
            return (
              <button
                key={c}
                onClick={() => toggle(c)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  on ? "bg-primary/10 border-primary text-primary" : "border-input hover:bg-muted"
                }`}
              >
                {on && <Check className="inline h-3 w-3 mr-1" />}
                {c}
              </button>
            );
          })}
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything else? e.g. 'Mom had breast cancer in her 50s'"
          className="min-h-[70px]"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          {hasHistory && (
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
