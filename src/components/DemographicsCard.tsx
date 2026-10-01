import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProfile, type Demographics } from "@/hooks/useProfile";
import { UserRound, Pencil, Check } from "lucide-react";
import { toast } from "sonner";

const SEX = ["Female", "Male", "Intersex", "Prefer not to say"];
const GENDER = ["Woman", "Man", "Non-binary", "Prefer not to say"];
const ANCESTRY = [
  "African / African American",
  "East Asian",
  "South Asian",
  "Southeast Asian",
  "Hispanic / Latino",
  "Middle Eastern / North African",
  "Ashkenazi Jewish",
  "Indigenous / Native American",
  "Pacific Islander",
  "European / White",
];
const PREGNANCY = ["Not applicable", "Trying to conceive", "Pregnant", "Postpartum", "Menopause / perimenopause"];

export default function DemographicsCard() {
  const { profile, update } = useProfile();
  const [editing, setEditing] = useState(false);
  const [d, setD] = useState<Demographics>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.demographics) setD(profile.demographics);
  }, [profile]);

  if (!profile) return null;

  const age = d.birth_year ? new Date().getFullYear() - Number(d.birth_year) : null;
  const filled = !!(profile.demographics && (profile.demographics.birth_year || profile.demographics.sex_at_birth));
  const toggleAncestry = (a: string) =>
    setD((p) => {
      const list = p.ancestry ?? [];
      return { ...p, ancestry: list.includes(a) ? list.filter((x) => x !== a) : [...list, a] };
    });

  const save = async () => {
    setSaving(true);
    const { error } = await update({ demographics: d });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved — suggestions will use this");
    setEditing(false);
  };

  if (!editing) {
    const p = profile.demographics ?? {};
    const pAge = p.birth_year ? new Date().getFullYear() - Number(p.birth_year) : null;
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <UserRound className="h-4 w-4 text-primary" />
              About you
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> {filled ? "Edit" : "Add"}
            </Button>
          </div>
          {!filled && (
            <CardDescription>
              Age, sex, heritage and family history change what's likely and when screening is due. All optional.
            </CardDescription>
          )}
        </CardHeader>
        {filled && (
          <CardContent className="flex flex-wrap gap-1.5">
            {pAge && <Badge variant="secondary">{pAge} years</Badge>}
            {p.sex_at_birth && <Badge variant="secondary">{p.sex_at_birth}</Badge>}
            {p.gender && p.gender !== p.sex_at_birth && <Badge variant="secondary">{p.gender}</Badge>}
            {p.pregnancy_status && p.pregnancy_status !== "Not applicable" && (
              <Badge variant="secondary">{p.pregnancy_status}</Badge>
            )}
            {p.ancestry?.map((a) => (
              <Badge key={a} variant="outline">{a}</Badge>
            ))}
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserRound className="h-4 w-4 text-primary" />
          About you
        </CardTitle>
        <CardDescription>
          Used only to tailor your suggestions and the screening that applies to you. Every field is optional.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">Year of birth</div>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="1983"
            value={d.birth_year ?? ""}
            onChange={(e) => setD({ ...d, birth_year: e.target.value ? Number(e.target.value) : undefined })}
            className="max-w-[140px]"
          />
          {age && age > 0 && age < 120 && <p className="text-xs text-muted-foreground mt-1">{age} years old</p>}
        </div>

        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1.5">Sex assigned at birth</div>
          <div className="flex flex-wrap gap-1.5">
            {SEX.map((s) => (
              <Button key={s} type="button" size="sm" variant={d.sex_at_birth === s ? "default" : "outline"}
                onClick={() => setD({ ...d, sex_at_birth: d.sex_at_birth === s ? undefined : s })}>
                {s}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1.5">Gender identity</div>
          <div className="flex flex-wrap gap-1.5">
            {GENDER.map((s) => (
              <Button key={s} type="button" size="sm" variant={d.gender === s ? "default" : "outline"}
                onClick={() => setD({ ...d, gender: d.gender === s ? undefined : s })}>
                {s}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1.5">Heritage / ancestry (choose any)</div>
          <div className="flex flex-wrap gap-1.5">
            {ANCESTRY.map((a) => (
              <Button key={a} type="button" size="sm" variant={d.ancestry?.includes(a) ? "default" : "outline"}
                onClick={() => toggleAncestry(a)}>
                {d.ancestry?.includes(a) && <Check className="h-3 w-3 mr-1" />}
                {a}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Only used where published evidence ties ancestry to a condition or screening — never to make assumptions about you.
          </p>
        </div>

        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1.5">Reproductive stage</div>
          <div className="flex flex-wrap gap-1.5">
            {PREGNANCY.map((s) => (
              <Button key={s} type="button" size="sm" variant={d.pregnancy_status === s ? "default" : "outline"}
                onClick={() => setD({ ...d, pregnancy_status: d.pregnancy_status === s ? undefined : s })}>
                {s}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">Anything else worth knowing</div>
          <Textarea
            rows={2}
            placeholder="Work, stress, existing conditions, lifestyle…"
            value={d.notes ?? ""}
            onChange={(e) => setD({ ...d, notes: e.target.value })}
          />
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}
