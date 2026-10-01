import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type Med = { id: string; name: string; dose: string | null; schedule: string | null; purpose: string | null; started_on: string | null; ended_on: string | null };

export default function Medications() {
  const { user } = useAuth();
  const [meds, setMeds] = useState<Med[]>([]);
  const [form, setForm] = useState({ name: "", dose: "", schedule: "", purpose: "" });
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from("medications").select("*").order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setMeds(data as Med[]);
  };
  useEffect(() => { load(); }, [user]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.name.trim()) return;
    setAdding(true);
    const { error } = await supabase.from("medications").insert({ user_id: user.id, ...form });
    setAdding(false);
    if (error) return toast.error(error.message);
    setForm({ name: "", dose: "", schedule: "", purpose: "" });
    load();
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("medications").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setMeds((m) => m.filter((x) => x.id !== id));
  };

  const stop = async (id: string) => {
    const { error } = await supabase.from("medications").update({ ended_on: new Date().toISOString().slice(0,10) }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Medications</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Add medication</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Lisinopril" /></div>
            <div className="space-y-1.5"><Label>Dose</Label><Input value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} placeholder="10mg" /></div>
            <div className="space-y-1.5"><Label>Schedule</Label><Input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Once daily, morning" /></div>
            <div className="space-y-1.5"><Label>Purpose</Label><Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Blood pressure" /></div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={adding}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {meds.length === 0 && <p className="text-sm text-muted-foreground">No medications yet.</p>}
        {meds.map((m) => (
          <Card key={m.id} className={m.ended_on ? "opacity-60" : ""}>
            <CardContent className="pt-4 flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-medium">{m.name} {m.dose && <span className="text-muted-foreground font-normal">— {m.dose}</span>}</div>
                {m.schedule && <div className="text-sm text-muted-foreground">{m.schedule}</div>}
                {m.purpose && <div className="text-xs text-muted-foreground">For: {m.purpose}</div>}
                {m.ended_on && <div className="text-xs text-muted-foreground">Stopped {m.ended_on}</div>}
              </div>
              <div className="flex gap-1">
                {!m.ended_on && <Button variant="outline" size="sm" onClick={() => stop(m.id)}>Stop</Button>}
                <Button variant="ghost" size="icon" onClick={() => del(m.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
