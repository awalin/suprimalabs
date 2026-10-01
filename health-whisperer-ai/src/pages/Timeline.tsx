import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type Entry = {
  id: string;
  entry_date: string;
  body: string;
  mood: number | null;
  symptoms: string[] | null;
  doctor: string | null;
  visit_type: string | null;
  ai_summary: string | null;
  entry_type: string | null;
};

export default function Timeline() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase
      .from("entries")
      .select("id,entry_date,body,mood,symptoms,doctor,visit_type,ai_summary,entry_type")
      .order("entry_date", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setEntries(data as Entry[]);
  };

  useEffect(() => { load(); }, [user]);

  const del = async (id: string) => {
    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setEntries((e) => e.filter((x) => x.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Timeline</h1>
      {loading && <p className="text-muted-foreground text-sm">Loading…</p>}
      {!loading && entries.length === 0 && (
        <Card><CardContent className="pt-6 text-center text-muted-foreground text-sm">No entries yet. Start by writing one on the Journal tab.</CardContent></Card>
      )}
      {entries.map((e) => (
        <Card key={e.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">{new Date(e.entry_date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</CardTitle>
                {e.ai_summary && <p className="text-sm text-muted-foreground mt-1">{e.ai_summary}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => del(e.id)} aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {e.entry_type === "check_in" && <Badge variant="default">Check-in</Badge>}
              {e.doctor && <Badge variant="secondary">Dr: {e.doctor}</Badge>}
              {e.visit_type && <Badge variant="secondary">{e.visit_type}</Badge>}
              {typeof e.mood === "number" && <Badge variant="secondary">Mood {e.mood}/5</Badge>}
              {e.symptoms?.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
            </div>
            <p className="text-sm whitespace-pre-wrap text-foreground/90">{e.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
