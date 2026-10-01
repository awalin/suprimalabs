import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type Report = {
  patterns?: string[];
  medication_observations?: string[];
  questions_for_doctor?: string[];
  lifestyle_suggestions?: string[];
  disclaimer?: string;
};

export default function Insights() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [weekLoading, setWeekLoading] = useState(false);
  const [week, setWeek] = useState<any | null>(null);

  const previewWeek = async () => {
    setWeekLoading(true);
    const { data, error } = await supabase.functions.invoke("weekly-summary", { body: { preview: true, days: 7 } });
    setWeekLoading(false);
    if (error) return toast.error(error.message);
    setWeek(data?.totals ?? null);
  };

  const run = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("insights", { body: { user_id: user.id } });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data?.error) return toast.error(String(data.detail ?? data.error));
    setReport(data);
  };

  useEffect(() => {
    supabase
      .from("insights")
      .select("content")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (data?.content) setReport(data.content as Report); });
  }, []);

  const Section = ({ title, items }: { title: string; items?: string[] }) =>
    items && items.length ? (
      <div>
        <h3 className="text-sm font-medium text-foreground mb-2">{title}</h3>
        <ul className="space-y-1.5 text-sm text-foreground/90">
          {items.map((s, i) => <li key={i} className="flex gap-2"><span className="text-primary mt-1">•</span><span>{s}</span></li>)}
        </ul>
      </div>
    ) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <p className="text-sm text-muted-foreground">AI patterns across your recent entries — and questions to bring to your next visit.</p>
      </div>

      <Card>
        <CardContent className="pt-6 flex items-center justify-between gap-4">
          <CardDescription>Generate a fresh report from your last 40 entries.</CardDescription>
          <Button onClick={run} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Analyze
          </Button>
        </CardContent>
      </Card>

      {report && (
        <Card>
          <CardHeader><CardTitle className="text-base">Your report</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <Section title="Patterns" items={report.patterns} />
            <Section title="Medication observations" items={report.medication_observations} />
            <Section title="Questions for your doctor" items={report.questions_for_doctor} />
            <Section title="Lifestyle ideas" items={report.lifestyle_suggestions} />
            {report.disclaimer && <p className="text-xs text-muted-foreground border-t pt-3">{report.disclaimer}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Weekly summary
          </CardTitle>
          <CardDescription>Every Sunday morning we total your week — entries, symptoms, medications and specialist visits — and email it to you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={previewWeek} disabled={weekLoading}>
            {weekLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Preview this week
          </Button>

          {week && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {[
                  ["Entries", week.entries],
                  ["Symptoms", week.symptoms?.length ?? 0],
                  ["Medications", week.medications?.length ?? 0],
                  ["Visits", week.specialist_visits?.length ?? 0],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-lg border p-3 text-center">
                    <div className="text-xl font-semibold text-primary">{String(value)}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
              {week.symptoms?.length ? (
                <div>
                  <div className="text-sm font-medium mb-1">Symptoms</div>
                  <div className="flex flex-wrap gap-1.5">
                    {week.symptoms.map((s: any) => (
                      <span key={s.name} className="rounded-full bg-muted px-2.5 py-1 text-xs">{s.name} · {s.count}×</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {week.specialist_visits?.length ? (
                <div>
                  <div className="text-sm font-medium mb-1">Specialist visits</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {week.specialist_visits.map((v: any, i: number) => (
                      <li key={i}>{v.doctor}{v.visit_type ? ` — ${v.visit_type}` : ""} · {new Date(v.date).toLocaleDateString()}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
