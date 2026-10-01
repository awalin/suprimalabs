import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Star, ShieldCheck, Phone, RefreshCw, Globe, Search } from "lucide-react";

type Provider = {
  name: string;
  practice?: string | null;
  specialty?: string | null;
  address?: string | null;
  phone?: string | null;
  rating?: number | null;
  reviews?: number | null;
  insurance?: string[];
  insurance_match?: "confirmed" | "likely" | "unknown";
  source?: string;
  source_url?: string | null;
  why?: string;
  ratings_url: string;
  insurance_url: string;
  map_url: string;
};

type Result = {
  specialty?: string;
  reason?: string | null;
  providers: Provider[];
  sources?: { title: string; url: string }[];
  note?: string | null;
  error?: string;
};

export default function SpecialistSidebar({
  text,
  insurance,
  demographics = null,
  familyHistory = null,
}: {
  text: string;
  insurance: string;
  demographics?: unknown;
  familyHistory?: unknown;
}) {
  const [location, setLocation] = useState(() => localStorage.getItem("pj_location") ?? "");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastQuery = useRef<string>("");

  useEffect(() => { localStorage.setItem("pj_location", location); }, [location]);

  const run = async (body: string) => {
    setLoading(true);
    setError(null);
    lastQuery.current = body + "|" + location + "|" + insurance;
    const { data, error: err } = await supabase.functions.invoke("find-specialists", {
      body: { text: body, location, insurance, demographics, family_history: familyHistory },
    });
    setLoading(false);
    if (err) return setError(err.message);
    if ((data as Result)?.error) return setError((data as Result).error!);
    setResult(data as Result);
  };

  // Automatically look up local specialists a moment after the user stops writing.
  useEffect(() => {
    const body = text.trim();
    if (body.length < 60 || !location.trim()) return;
    const key = body + "|" + location + "|" + insurance;
    if (key === lastQuery.current) return;
    const t = setTimeout(() => run(body), 1600);
    return () => clearTimeout(t);
  }, [text, location, insurance]);

  const insuranceTone = (m?: string) =>
    m === "confirmed" ? "text-primary" : m === "likely" ? "text-muted-foreground" : "text-muted-foreground";

  return (
    <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Care near you
          </CardTitle>
          <CardDescription>
            As you write, we look up specialists in your area, their ratings and the plans they take.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Your city or ZIP (e.g. Ashburn, VA 20147)"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled={loading || text.trim().length < 20 || !location.trim()}
              onClick={() => run(text.trim())}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              {loading ? "Searching…" : "Search now"}
            </Button>
          </div>
          {!location.trim() && (
            <p className="text-xs text-muted-foreground">Add your city or ZIP to start the search.</p>
          )}
          {location.trim() && !result && !loading && (
            <p className="text-xs text-muted-foreground">
              Keep writing — the search runs on its own once there's enough to go on.
            </p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {result?.specialty && (
        <Card>
          <CardContent className="pt-5 space-y-2 text-sm">
            <Badge variant="secondary" className="capitalize">{result.specialty}</Badge>
            {result.reason && <p className="text-muted-foreground leading-relaxed">{result.reason}</p>}
          </CardContent>
        </Card>
      )}

      {result?.providers?.map((p, i) => (
        <Card key={i}>
          <CardContent className="pt-5 space-y-2 text-sm">
            <div className="font-medium leading-snug">{p.name}</div>
            {p.specialty && <div className="text-xs text-muted-foreground">{p.specialty}</div>}

            <div className="flex flex-wrap items-center gap-3 text-xs">
              {typeof p.rating === "number" ? (
                <span className="inline-flex items-center gap-1 text-primary">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {p.rating.toFixed(1)}
                  {p.reviews ? <span className="text-muted-foreground">({p.reviews})</span> : null}
                </span>
              ) : (
                <a href={p.ratings_url} target="_blank" rel="noreferrer"
                   className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary hover:underline">
                  <Star className="h-3.5 w-3.5" /> See ratings
                </a>
              )}
            </div>

            <div className={`text-xs inline-flex items-start gap-1 ${insuranceTone(p.insurance_match)}`}>
              <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                {p.insurance_match === "confirmed" && insurance
                  ? `Listed as accepting ${insurance}`
                  : p.insurance?.length
                  ? `Plans mentioned: ${p.insurance.slice(0, 4).join(", ")}`
                  : "Insurance not published — "}
                {p.insurance_match !== "confirmed" && !p.insurance?.length && (
                  <a href={p.insurance_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    check your plan
                  </a>
                )}
              </span>
            </div>

            {p.address && (
              <a href={p.map_url} target="_blank" rel="noreferrer"
                 className="text-xs inline-flex items-start gap-1 text-muted-foreground hover:text-primary hover:underline">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {p.address}
              </a>
            )}
            {p.phone && (
              <a href={`tel:${p.phone}`} className="text-xs inline-flex items-center gap-1 text-muted-foreground hover:text-primary">
                <Phone className="h-3.5 w-3.5" /> {p.phone}
              </a>
            )}
            {p.why && <p className="text-xs leading-relaxed">{p.why}</p>}
            {p.source_url && (
              <a href={p.source_url} target="_blank" rel="noreferrer"
                 className="text-xs inline-flex items-center gap-1 text-primary hover:underline">
                <Globe className="h-3.5 w-3.5" /> Where this came from
              </a>
            )}
          </CardContent>
        </Card>
      ))}

      {result && result.providers?.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-5 text-sm text-muted-foreground">
            {result.note ?? "Nothing solid came back for that area. Try a nearby larger city or ZIP."}
          </CardContent>
        </Card>
      )}

      {result?.providers?.length ? (
        <p className="text-xs text-muted-foreground px-1">
          Names, addresses and phone numbers come from the national provider registry; ratings and plan details come from
          public listings. Always confirm coverage with the office before booking.
        </p>
      ) : null}
    </aside>
  );
}
