import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck } from "lucide-react";

export const CONSENT_VERSION = "2026-10-01";

export default function ConsentGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "needed" | "ok">("loading");
  const [agree, setAgree] = useState(false);
  const [adult, setAdult] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("health_consent_version").eq("id", user.id).maybeSingle()
      .then(({ data }) => setStatus(data?.health_consent_version === CONSENT_VERSION ? "ok" : "needed"));
  }, [user]);

  const accept = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").upsert({
      id: user.id, health_consent_at: new Date().toISOString(), health_consent_version: CONSENT_VERSION,
    });
    setSaving(false);
    setStatus("ok");
  };

  const decline = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (status === "ok") return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full rounded-xl border bg-card p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-primary" /></div>
          <h1 className="text-xl font-semibold">Before you start</h1>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Pulse Journal stores health information you choose to add: symptoms, moods, medicines, vitals, cycle and sexual-health notes, family history, photos and documents.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>We use it only to run your journal and its AI features.</li>
            <li>We never sell it or share it with advertisers.</li>
            <li>You can export or permanently delete everything anytime from Account.</li>
          </ul>
          <p className="rounded-md bg-muted p-3 text-foreground">Pulse Journal is a personal wellness tool, not a medical device. It doesn't diagnose, treat, or replace professional care. In an emergency, call 911.</p>
        </div>
        <label className="flex items-start gap-3 text-sm">
          <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5" />
          <span>I consent to Pulse Journal collecting and processing my health information as described in the{" "}
            <Link to="/privacy" target="_blank" className="text-primary underline">Privacy Policy</Link> and agree to the{" "}
            <Link to="/terms" target="_blank" className="text-primary underline">Terms of Use</Link>.</span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <Checkbox checked={adult} onCheckedChange={(v) => setAdult(v === true)} className="mt-0.5" />
          <span>I am 18 or older.</span>
        </label>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={decline}>No thanks</Button>
          <Button disabled={!agree || !adult || saving} onClick={accept}>{saving ? "Saving…" : "I agree"}</Button>
        </div>
      </div>
    </div>
  );
}
