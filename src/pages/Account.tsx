import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Download, Trash2, ShieldCheck } from "lucide-react";

const TABLES = [
  "profiles", "entries", "medications", "entry_medications", "vitals", "lab_results", "insights",
  "schedule_items", "attachments", "ehr_connections", "calendar_connections",
] as const;
const SECRET_FIELDS = ["access_token", "refresh_token"];
const DEMO_EMAIL = "demo@pulsejournal.app";

export default function Account() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const isDemo = user?.email === DEMO_EMAIL;

  const exportData = async () => {
    setExporting(true);
    try {
      const out: Record<string, unknown> = { exported_at: new Date().toISOString(), account: { id: user?.id, email: user?.email } };
      for (const t of TABLES) {
        const { data, error } = await (supabase.from(t as any) as any).select("*");
        if (error) { out[t] = { error: error.message }; continue; }
        out[t] = (data ?? []).map((r: Record<string, unknown>) => {
          const c = { ...r };
          SECRET_FIELDS.forEach((f) => { if (f in c) c[f] = "[removed]"; });
          return c;
        });
      }
      const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `pulse-journal-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Your data was downloaded.");
    } catch (e) {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke("delete-account", { body: {} });
    setDeleting(false);
    if (error || data?.error) {
      toast.error(data?.error ?? "Couldn't delete your account. Please try again.");
      return;
    }
    await supabase.auth.signOut();
    toast.success("Your account and all data were permanently deleted.");
    navigate("/", { replace: true });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account & privacy</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" /> Export my data</CardTitle>
          <CardDescription>Download everything in your journal (entries, medicines, vitals, labs, schedule, file list) as one file.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={exportData} disabled={exporting}>{exporting ? "Preparing…" : "Download my data"}</Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5" /> Delete my account</CardTitle>
          <CardDescription>Permanently deletes your account, journal, uploaded files and imported records. This can't be undone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isDemo ? (
            <p className="text-sm text-muted-foreground">The shared demo account can't be deleted.</p>
          ) : (
            <>
              <p className="text-sm">Type <strong>DELETE</strong> to confirm.</p>
              <div className="flex gap-2">
                <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETE" className="max-w-[200px]" />
                <Button variant="destructive" disabled={confirm !== "DELETE" || deleting} onClick={deleteAccount}>
                  {deleting ? "Deleting…" : "Delete forever"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Your privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>We never sell your health information or share it with advertisers.</p>
          <p>Pulse Journal is a personal wellness tool, not a medical device. It doesn't diagnose, treat, or replace professional care.</p>
          <div className="flex gap-4 pt-2">
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="text-primary hover:underline">Terms of Use</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
