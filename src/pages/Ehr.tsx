import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeartPulse, Loader2, Download, Trash2, ShieldCheck, RefreshCw, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { beginLaunch, redirectUri } from "@/lib/smart";

type Connection = {
  id: string;
  provider_name: string;
  fhir_base_url: string;
  patient_id: string | null;
  patient_name: string | null;
  auth_mode: string;
  access_token: string | null;
  last_synced_at: string | null;
};

type Lab = {
  id: string;
  name: string;
  value: number | null;
  value_text: string | null;
  unit: string | null;
  reference_range: string | null;
  interpretation: string | null;
  observed_at: string | null;
};

type ImportResult = {
  patient?: { name: string | null; birth_date: string | null; gender: string | null } | null;
  counts: Record<string, number>;
  diagnoses?: string[];
  preview?: {
    medications?: { name: string; dose: string | null; schedule: string | null }[];
    visits?: { date: string; type: string | null; doctor: string | null }[];
    labs?: { name: string; value: number | string | null; unit: string | null; observed_at: string | null }[];
  };
};

const SANDBOX_BASE = "https://r4.smarthealthit.org";

const fmt = (v: number | string | null | undefined) => {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  return Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1);
};

export default function Ehr() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportResult | null>(null);

  // sandbox form
  const [sandboxPatient, setSandboxPatient] = useState("");
  // real provider form
  const [providerName, setProviderName] = useState("");
  const [fhirBase, setFhirBase] = useState("");
  const [clientId, setClientId] = useState("");

  const load = async () => {
    const [{ data: conns }, { data: labRows }] = await Promise.all([
      supabase.from("ehr_connections").select("*").order("created_at", { ascending: false }),
      supabase.from("lab_results").select("id,name,value,value_text,unit,reference_range,interpretation,observed_at")
        .order("observed_at", { ascending: false }).limit(25),
    ]);
    setConnections((conns ?? []) as Connection[]);
    setLabs((labRows ?? []) as Lab[]);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const runImport = async (conn: Connection, dryRun: boolean) => {
    setBusy(conn.id + (dryRun ? ":preview" : ":import"));
    setPreview(null);
    const { data, error } = await supabase.functions.invoke("fhir-import", {
      body: {
        connection_id: conn.id,
        provider_name: conn.provider_name,
        fhir_base_url: conn.fhir_base_url,
        patient_id: conn.patient_id,
        access_token: conn.access_token,
        dry_run: dryRun,
      },
    });
    setBusy(null);
    if (error) {
      const detail = "context" in error ? await (error as any).context.text().catch(() => "") : "";
      return toast.error(detail || error.message);
    }
    if ((data as any)?.error) return toast.error((data as any).error);
    setPreview(data as ImportResult);
    if (!dryRun) {
      const c = (data as ImportResult).counts;
      toast.success(`Imported ${c.medications} medications, ${c.visits} visits, ${c.labs} lab results`);
      load();
    }
  };

  const addSandbox = async () => {
    if (!user) return;
    if (!sandboxPatient.trim()) return toast.error("Enter a patient ID from the test server");
    setBusy("add-sandbox");
    const { error } = await supabase.from("ehr_connections").insert({
      user_id: user.id,
      provider_name: "SMART test server",
      fhir_base_url: SANDBOX_BASE,
      patient_id: sandboxPatient.trim(),
      auth_mode: "open",
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    setSandboxPatient("");
    toast.success("Test record connected");
    load();
  };

  const startLaunch = async () => {
    if (!fhirBase.trim() || !clientId.trim() || !providerName.trim()) {
      return toast.error("Provider name, record address and app ID are all required");
    }
    setBusy("launch");
    try {
      await beginLaunch({ provider_name: providerName.trim(), fhir_base_url: fhirBase.trim(), client_id: clientId.trim() });
    } catch (e) {
      setBusy(null);
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("ehr_connections").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setConnections((c) => c.filter((x) => x.id !== id));
    toast.success("Disconnected. Records already imported stay in your journal.");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Provider records</h1>
        <p className="text-sm text-muted-foreground">
          Bring medications, visits and lab results from your clinic or hospital portal into your journal. Read-only —
          nothing is ever written back to your provider's chart.
        </p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-5 text-sm flex gap-3">
          <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>
            You sign in at your provider's own login page and choose what to share. Pulse Journal only reads your record,
            and copies stay in your personal journal.
          </span>
        </CardContent>
      </Card>

      {connections.map((c) => (
        <Card key={c.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-primary" /> {c.provider_name}
                </CardTitle>
                <CardDescription className="truncate">
                  {c.patient_name ? `${c.patient_name} · ` : ""}{c.fhir_base_url}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Badge variant={c.auth_mode === "open" ? "outline" : "secondary"}>
                  {c.auth_mode === "open" ? "Test record" : "Signed in"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {c.last_synced_at ? `Last import ${new Date(c.last_synced_at).toLocaleDateString()}` : "Never imported"}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => runImport(c, true)} disabled={!!busy}>
              {busy === c.id + ":preview" ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
              Preview
            </Button>
            <Button size="sm" onClick={() => runImport(c, false)} disabled={!!busy}>
              {busy === c.id + ":import" ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
              Import records
            </Button>
            <Button size="sm" variant="ghost" onClick={() => remove(c.id)} disabled={!!busy}>
              <Trash2 className="h-4 w-4 mr-1.5" /> Disconnect
            </Button>
          </CardContent>
        </Card>
      ))}

      {preview && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">What we found</CardTitle>
            <CardDescription>
              {preview.patient?.name ? `${preview.patient.name} · ` : ""}
              {Object.entries(preview.counts).map(([k, v]) => `${v} ${k}`).join(" · ")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!!preview.preview?.medications?.length && (
              <div>
                <div className="font-medium mb-1">Medications</div>
                <ul className="space-y-1 text-muted-foreground">
                  {preview.preview.medications.map((m, i) => (
                    <li key={i}>{m.name}{m.dose ? ` · ${m.dose}` : ""}{m.schedule ? ` · ${m.schedule}` : ""}</li>
                  ))}
                </ul>
              </div>
            )}
            {!!preview.preview?.visits?.length && (
              <>
                <Separator />
                <div>
                  <div className="font-medium mb-1">Visits</div>
                  <ul className="space-y-1 text-muted-foreground">
                    {preview.preview.visits.map((v, i) => (
                      <li key={i}>
                        {v.date ? new Date(v.date).toLocaleDateString() : "—"} · {v.type}{v.doctor ? ` · ${v.doctor}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            {!!preview.preview?.labs?.length && (
              <>
                <Separator />
                <div>
                  <div className="font-medium mb-1">Lab results</div>
                  <ul className="space-y-1 text-muted-foreground">
                    {preview.preview.labs.map((l, i) => (
                      <li key={i}>{l.name}: {fmt(l.value)} {l.unit ?? ""}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            {!!preview.diagnoses?.length && (
              <>
                <Separator />
                <div>
                  <div className="font-medium mb-1">Conditions on file</div>
                  <div className="flex flex-wrap gap-1.5">
                    {preview.diagnoses.map((d) => <Badge key={d} variant="outline">{d}</Badge>)}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Connect a record</CardTitle>
          <CardDescription>Use a test record to see how it works, or sign in to a real provider portal.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sandbox">
            <TabsList className="mb-4">
              <TabsTrigger value="sandbox">Test record</TabsTrigger>
              <TabsTrigger value="provider">My provider</TabsTrigger>
            </TabsList>

            <TabsContent value="sandbox" className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The public SMART test server holds sample patients with real-shaped records. Paste a patient ID from{" "}
                <a className="underline" href="https://launch.smarthealthit.org" target="_blank" rel="noreferrer">launch.smarthealthit.org</a>{" "}
                to try the full import.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="pid">Patient ID</Label>
                <Input id="pid" value={sandboxPatient} onChange={(e) => setSandboxPatient(e.target.value)} placeholder="e.g. 87a339d0-8cae-418e-89c7-8651e6aab3c6" />
              </div>
              <Button size="sm" onClick={addSandbox} disabled={busy === "add-sandbox"}>
                {busy === "add-sandbox" && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />} Connect test record
              </Button>
            </TabsContent>

            <TabsContent value="provider" className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Most health systems publish a patient-app address and require you to register this app once with them.
                Enter the details they give you, then sign in at their page.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="pname">Provider name</Label>
                <Input id="pname" value={providerName} onChange={(e) => setProviderName(e.target.value)} placeholder="e.g. Riverside Health" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="base">Record address (FHIR endpoint)</Label>
                <Input id="base" value={fhirBase} onChange={(e) => setFhirBase(e.target.value)} placeholder="https://fhir.example.org/api/FHIR/R4" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cid">App ID they gave you</Label>
                <Input id="cid" value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="client id" />
              </div>
              <p className="text-xs text-muted-foreground">
                Return address to register with them: <code className="text-foreground">{redirectUri()}</code>
              </p>
              <Button size="sm" onClick={startLaunch} disabled={busy === "launch"}>
                {busy === "launch" && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />} Sign in at provider
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {!!labs.length && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" /> Lab results
            </CardTitle>
            <CardDescription>Most recent results imported from your provider record.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {labs.map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-3 border-b last:border-0 pb-2 last:pb-0">
                <div className="min-w-0">
                  <div className="font-medium truncate">{l.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.observed_at ? new Date(l.observed_at).toLocaleDateString() : "—"}
                    {l.reference_range ? ` · normal ${l.reference_range}` : ""}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div>{l.value != null ? fmt(l.value) : l.value_text ?? "—"} {l.unit ?? ""}</div>
                  {l.interpretation && <div className="text-xs text-muted-foreground">{l.interpretation}</div>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
