import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { exchangeCode, takePending } from "@/lib/smart";

export default function EhrCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const providerError = params.get("error_description") ?? params.get("error");
      if (providerError) return setError(providerError);

      const code = params.get("code");
      const state = params.get("state");
      const pending = takePending();
      if (!code || !pending) return setError("This sign-in link has expired. Please start the connection again.");
      if (state !== pending.state) return setError("Sign-in could not be verified. Please try again.");

      try {
        const token = await exchangeCode(pending, code);
        const { data: session } = await supabase.auth.getUser();
        if (!session?.user) return setError("Please sign in to Pulse Journal first.");

        const { error: insertError } = await supabase.from("ehr_connections").insert({
          user_id: session.user.id,
          provider_name: pending.provider_name,
          fhir_base_url: pending.fhir_base_url,
          patient_id: token.patient ?? null,
          auth_mode: "smart",
          access_token: token.access_token,
          refresh_token: token.refresh_token ?? null,
          scope: token.scope ?? null,
          token_expires_at: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
        });
        if (insertError) return setError(insertError.message);

        toast.success(`Connected to ${pending.provider_name}`);
        navigate("/ehr", { replace: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-sm">
          {error ? (
            <div className="space-y-3">
              <div className="flex gap-2 text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
              <button className="underline text-muted-foreground" onClick={() => navigate("/ehr", { replace: true })}>
                Back to provider records
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Finishing the connection…
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
