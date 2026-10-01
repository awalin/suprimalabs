import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Download, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

type Prep = {
  top_concerns?: string[];
  symptoms_to_mention?: string[];
  questions_to_ask?: string[];
  medication_questions?: string[];
  lifestyle_notes?: string[];
};
type Med = { name: string; dose?: string; schedule?: string; purpose?: string };
type Vital = { type: string; value: number | null; value_text: string | null; unit: string | null; recorded_at: string };
type Result = { prep: Prep; medications: Med[]; vitals: Vital[]; family_history: any; entry_count: number };

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, fontFamily: "Helvetica", color: "#111" },
  h1: { fontSize: 18, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  meta: { fontSize: 9, color: "#666", marginBottom: 14 },
  h2: { fontSize: 12, marginTop: 14, marginBottom: 6, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  item: { marginBottom: 3, paddingLeft: 8 },
  row: { flexDirection: "row", marginBottom: 2 },
  cellL: { width: 130, fontFamily: "Helvetica-Bold" },
  cellR: { flex: 1 },
  disclaimer: { marginTop: 18, fontSize: 8, color: "#888", borderTop: 1, borderColor: "#ddd", paddingTop: 6 },
});

function PrepDoc({ data }: { data: Result }) {
  const { prep, medications, vitals, family_history } = data;
  const date = new Date().toLocaleDateString(undefined, { dateStyle: "long" });
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.h1}>Visit Prep — Pulse Journal</Text>
        <Text style={styles.meta}>Generated {date} · Based on last 30 days · {data.entry_count} entries</Text>

        {prep.top_concerns?.length ? (
          <View>
            <Text style={styles.h2}>Top concerns</Text>
            {prep.top_concerns.map((c, i) => <Text key={i} style={styles.item}>• {c}</Text>)}
          </View>
        ) : null}

        {prep.symptoms_to_mention?.length ? (
          <View>
            <Text style={styles.h2}>Symptoms to mention</Text>
            {prep.symptoms_to_mention.map((c, i) => <Text key={i} style={styles.item}>• {c}</Text>)}
          </View>
        ) : null}

        {prep.questions_to_ask?.length ? (
          <View>
            <Text style={styles.h2}>Questions to ask</Text>
            {prep.questions_to_ask.map((c, i) => <Text key={i} style={styles.item}>{i + 1}. {c}</Text>)}
          </View>
        ) : null}

        {medications?.length ? (
          <View>
            <Text style={styles.h2}>Current medications</Text>
            {medications.map((m, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.cellL}>{m.name}</Text>
                <Text style={styles.cellR}>
                  {[m.dose, m.schedule, m.purpose].filter(Boolean).join(" · ")}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {prep.medication_questions?.length ? (
          <View>
            <Text style={styles.h2}>Questions about medications</Text>
            {prep.medication_questions.map((c, i) => <Text key={i} style={styles.item}>• {c}</Text>)}
          </View>
        ) : null}

        {vitals?.length ? (
          <View>
            <Text style={styles.h2}>Recent vitals</Text>
            {vitals.slice(0, 10).map((v, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.cellL}>{v.type}</Text>
                <Text style={styles.cellR}>
                  {(v.value_text ?? v.value)} {v.unit ?? ""} — {new Date(v.recorded_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {family_history?.conditions?.length || family_history?.notes ? (
          <View>
            <Text style={styles.h2}>Family history</Text>
            {family_history?.conditions?.length ? (
              <Text style={styles.item}>{family_history.conditions.join(", ")}</Text>
            ) : null}
            {family_history?.notes ? <Text style={styles.item}>{family_history.notes}</Text> : null}
          </View>
        ) : null}

        {prep.lifestyle_notes?.length ? (
          <View>
            <Text style={styles.h2}>Lifestyle notes</Text>
            {prep.lifestyle_notes.map((c, i) => <Text key={i} style={styles.item}>• {c}</Text>)}
          </View>
        ) : null}

        <Text style={styles.disclaimer}>
          Pulse Journal is a personal wellness tool, not a medical record or device. This summary reflects what you wrote and does not replace professional medical advice.
        </Text>
      </Page>
    </Document>
  );
}

export default function VisitPrep() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [downloading, setDownloading] = useState(false);

  const generate = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("visit-prep", { body: { user_id: user.id } });
    setLoading(false);
    if (error) return toast.error(error.message);
    setResult(data as Result);
  };

  const download = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const blob = await pdf(<PrepDoc data={result} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `visit-prep-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const Section = ({ title, items }: { title: string; items?: string[] }) =>
    items && items.length ? (
      <div>
        <h3 className="text-sm font-medium mb-2">{title}</h3>
        <ul className="space-y-1 text-sm">
          {items.map((s, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{s}</li>)}
        </ul>
      </div>
    ) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Visit prep</h1>
        <p className="text-sm text-muted-foreground">
          Walk into your next appointment ready. We'll pull from your last 30 days to highlight what to mention.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 flex items-center justify-between gap-4">
          <CardDescription className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> Build a one-page summary for your doctor.
          </CardDescription>
          <Button onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {result ? "Regenerate" : "Generate"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Your brief</CardTitle>
                <Button size="sm" variant="outline" onClick={download} disabled={downloading}>
                  <Download className="h-4 w-4 mr-1.5" />
                  {downloading ? "Building PDF…" : "Download PDF"}
                </Button>
              </div>
              <CardDescription>{result.entry_count} entries · {result.medications.length} meds · {result.vitals.length} vitals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Section title="Top concerns" items={result.prep.top_concerns} />
              <Section title="Symptoms to mention" items={result.prep.symptoms_to_mention} />
              <Section title="Questions to ask" items={result.prep.questions_to_ask} />
              <Section title="Questions about medications" items={result.prep.medication_questions} />
              <Section title="Lifestyle notes" items={result.prep.lifestyle_notes} />
              <p className="text-xs text-muted-foreground border-t pt-3">
                This is a personal summary, not medical advice. Bring it as a starting point for your conversation.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
