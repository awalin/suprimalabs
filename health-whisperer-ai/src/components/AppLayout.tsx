import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Activity, BookOpen, Pill, Sparkles, LogOut, Heart, ClipboardList, CalendarDays, FolderOpen, Plug, HeartPulse } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { to: "/journal", label: "Journal", icon: BookOpen, end: true },
  { to: "/timeline", label: "Timeline", icon: Activity },
  { to: "/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/vitals", label: "Vitals", icon: Heart },
  { to: "/medications", label: "Medications", icon: Pill },
  { to: "/visit-prep", label: "Prep", icon: ClipboardList },
  { to: "/documents", label: "Docs", icon: FolderOpen },
  { to: "/insights", label: "Insights", icon: Sparkles },
  { to: "/connections", label: "Apps", icon: Plug },
  { to: "/ehr", label: "Records", icon: HeartPulse },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/60 backdrop-blur sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold tracking-tight">Pulse Journal</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 pb-24">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t bg-card/95 backdrop-blur overflow-x-auto">
        <div className="flex min-w-max">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `flex-1 min-w-[68px] flex flex-col items-center gap-1 py-2.5 text-xs ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {l.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
