import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarClock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type Item = { id: string; title: string; start_at: string | null; location: string | null };

export default function UpcomingBanner() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 3600 * 1000);
    supabase
      .from("schedule_items")
      .select("id,title,start_at,location")
      .eq("done", false)
      .gte("start_at", now.toISOString())
      .lte("start_at", in24h.toISOString())
      .order("start_at", { ascending: true })
      .limit(3)
      .then(({ data }) => setItems((data ?? []) as Item[]));
  }, [user]);

  if (items.length === 0) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="pt-5 pb-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarClock className="h-4 w-4 text-primary" />
            Coming up in the next 24 hours
          </div>
          <Link to="/schedule" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <ul className="text-sm space-y-1">
          {items.map((i) => {
            const t = i.start_at ? new Date(i.start_at) : null;
            return (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="truncate">{i.title}{i.location ? ` · ${i.location}` : ""}</span>
                <span className="text-muted-foreground text-xs flex-shrink-0">
                  {t?.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
