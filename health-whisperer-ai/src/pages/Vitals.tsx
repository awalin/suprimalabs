import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Heart, Scale, Moon, Activity, Footprints, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Vital = {
  id: string;
  type: string;
  value: number | null;
  value_text: string | null;
  unit: string | null;
  recorded_at: string;
  note: string | null;
};

const VITAL_TYPES = [
  { value: "bp", label: "Blood pressure", unit: "mmHg", icon: Heart, isText: true, placeholder: "120/80" },
  { value: "weight", label: "Weight", unit: "lb", icon: Scale, isText: false, placeholder: "165" },
  { value: "sleep", label: "Sleep", unit: "hours", icon: Moon, isText: false, placeholder: "7.5" },
  { value: "heart_rate", label: "Resting HR", unit: "bpm", icon: Activity, isText: false, placeholder: "68" },
  { value: "steps", label: "Steps", unit: "steps", icon: Footprints, isText: false, placeholder: "8200" },
];

export default function Vitals() {
  const { user } = useAuth();
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [type, setType] = useState("weight");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("vitals")
      .select("id,type,value,value_text,unit,recorded_at,note")
      .order("recorded_at", { ascending: false })
      .limit(200);
    setVitals((data ?? []) as Vital[]);
  };

  useEffect(() => { load(); }, [user]);

  const config = VITAL_TYPES.find((t) => t.value === type)!;

  const add = async () => {
    if (!user || !value.trim()) return;
    setSaving(true);
    const row: any = {
      user_id: user.id,
      type,
      unit: config.unit,
      source: "manual",
    };
    if (config.isText) {
      row.value_text = value.trim();
      // try to extract systolic for charting (e.g. "120/80")
      const m = value.match(/^(\d+)/);
      if (m) row.value = parseFloat(m[1]);
    } else {
      const n = parseFloat(value);
      if (Number.isNaN(n)) { setSaving(false); return toast.error("Enter a number"); }
      row.value = n;
    }
    const { error } = await supabase.from("vitals").insert(row);
    setSaving(false);
    if (error) return toast.error(error.message);
    setValue("");
    toast.success("Logged");
    load();
  };

  const del = async (id: string) => {
    await supabase.from("vitals").delete().eq("id", id);
    setVitals((v) => v.filter((x) => x.id !== id));
  };

  // Chart data: filter selected type, last 30 entries, oldest-first
  const chartData = [...vitals.filter((v) => v.type === type)]
    .reverse()
    .slice(-30)
    .map((v) => ({
      t: new Date(v.recorded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      v: v.value,
      label: v.value_text ?? v.value,
    }));

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vitals</h1>
        <p className="text-sm text-muted-foreground">Track BP, weight, sleep and more. Manual logs only — keeps it private and simple.</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Log a reading</CardTitle>
          <CardDescription>Pick a type, enter the value.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[140px]">
              <Select value={type} onValueChange={(v) => { setType(v); setValue(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VITAL_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={config.placeholder}
                inputMode={config.isText ? "text" : "decimal"}
              />
            </div>
            <Button onClick={add} disabled={saving || !value.trim()}>
              {saving ? "Saving…" : `Log ${config.unit}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <config.icon className="h-4 w-4 text-primary" /> {config.label} trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: -20, top: 5, right: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} formatter={(_v, _n, p: any) => [p.payload.label + " " + config.unit, config.label]} />
                  <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {vitals.length === 0 && <p className="text-sm text-muted-foreground">Nothing logged yet.</p>}
          {vitals.slice(0, 20).map((v) => {
            const cfg = VITAL_TYPES.find((t) => t.value === v.type);
            return (
              <div key={v.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{cfg?.label ?? v.type}</Badge>
                  <span className="font-medium">{v.value_text ?? v.value} {v.unit}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs">{new Date(v.recorded_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
                  <Button variant="ghost" size="icon" onClick={() => del(v.id)} aria-label="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
