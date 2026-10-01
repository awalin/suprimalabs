import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft, Mail } from "lucide-react";
import journalImg from "@/assets/pulse-journal.jpg";
import timelineImg from "@/assets/pulse-timeline.jpg";
import insightsImg from "@/assets/pulse-insights.jpg";
import medicationsImg from "@/assets/pulse-medications.jpg";
import visitprepImg from "@/assets/pulse-visitprep.jpg";
import familyImg from "@/assets/pulse-family.jpg";
import connectionsImg from "@/assets/pulse-connections.jpg";

const screens = [
  { img: journalImg, t: "Write it your way", d: "Describe your day, your cycle or a visit in plain words. Pulse picks out symptoms, medicines and timing, and suggests which kind of specialist could help." },
  { img: timelineImg, t: "Your health, in order", d: "Every entry, visit and lab result on one timeline, so patterns across months and life stages are easy to see." },
  { img: insightsImg, t: "Patterns and weekly summary", d: "Gentle insights that connect symptoms with sleep, stress, cycle and medicines, plus a weekly recap." },
  { img: medicationsImg, t: "Medicines, tracked", d: "Keep a clear list of what you take, snap a photo of a label, and see how changes line up with how you feel." },
  { img: visitprepImg, t: "Walk in prepared", d: "A one-page brief for your next appointment: what changed, what to mention and the questions you want answered." },
  { img: familyImg, t: "Family history that matters", d: "Capture conditions in your family so suggestions reflect your real risk, not an average." },
  { img: connectionsImg, t: "Bring it all together", d: "Connect calendars and import records from your clinic portal — read-only, always in your control." },
];

export default function PulseShowcase() {
  return (
    <div className="theme-vibrant min-h-screen bg-background text-foreground">
      <header className="border-b bg-card/60 backdrop-blur sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> SuprimaLabs
          </Link>
          <div className="flex items-center gap-2 font-semibold"><Activity className="h-5 w-5 text-primary" /> Pulse Journal</div>
        </div>
      </header>

      <section className="container py-20 max-w-3xl text-center">
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">Women's health</span>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight mt-5 mb-5">A health journal that helps women get heard.</h1>
        <p className="text-lg text-muted-foreground">
          Track cycles, perimenopause, pregnancy, pain and mood in your own words — and turn them into evidence your doctor can act on.
        </p>
      </section>

      <main className="container pb-20 space-y-20">
        {screens.map((s, i) => (
          <section key={s.t} className={`grid md:grid-cols-5 gap-10 items-center ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
            <div className="md:col-span-3 rounded-2xl border bg-card p-2 shadow-sm overflow-hidden">
              <img src={s.img} alt={`Pulse Journal — ${s.t}`} className="w-full rounded-xl" loading="lazy" />
            </div>
            <div className="md:col-span-2">
              <h2 className="text-2xl font-semibold mb-3">{s.t}</h2>
              <p className="text-muted-foreground">{s.d}</p>
            </div>
          </section>
        ))}
      </main>

      <section className="border-t bg-card/40">
        <div className="container py-16 text-center max-w-2xl">
          <h2 className="text-2xl font-semibold mb-3">Coming soon</h2>
          <p className="text-muted-foreground mb-6">Pulse Journal is in early pilot. Want early access or to partner with us?</p>
          <Button asChild size="lg"><Link to="/#contact"><Mail className="h-4 w-4 mr-2" /> Request early access</Link></Button>
        </div>
      </section>

      <footer className="border-t">
        <div className="container py-8 text-xs text-muted-foreground flex justify-between">
          <span>© {new Date().getFullYear()} SuprimaLabs</span>
          <span>Screens shown use sample data. Not medical advice. · <Link to="/privacy" className="hover:text-foreground">Privacy</Link></span>
        </div>
      </footer>
    </div>
  );
}
