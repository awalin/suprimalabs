import { Button } from "@/components/ui/button";
import {
  Activity, BookOpen, Sparkles, ClipboardList, FolderOpen, HeartPulse, Stethoscope, ArrowRight, Compass, Shield, HandHeart, Mail,
} from "lucide-react";

const values = [
  { icon: HandHeart, t: "People first", d: "We design for patients and caregivers — not for billing codes." },
  { icon: Shield, t: "Private by design", d: "Your health story belongs to you. We read records, never write them." },
  { icon: Compass, t: "Evidence, explained", d: "Plain-language guidance linked to trusted medical sources." },
];

const pulseFeatures = [
  { icon: BookOpen, t: "Cycle & symptom journal" },
  { icon: HandHeart, t: "Perimenopause & menopause" },
  { icon: Stethoscope, t: "OB-GYN & specialists nearby" },
  { icon: ClipboardList, t: "Visit prep briefs" },
  { icon: FolderOpen, t: "Doctor's notes explained" },
  { icon: Sparkles, t: "Patterns & weekly summary" },
];

const team = [
  { name: "Awalin Sopan", role: "Founder", bio: "Leads product and research at SuprimaLabs." },
  { name: "Team member", role: "Role to be added", bio: "Short bio to be added." },
  { name: "Advisor", role: "Clinical advisor", bio: "Short bio to be added." },
];

const initials = (n: string) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card/60 backdrop-blur sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <a href="#top" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">S</div>
            <span className="font-semibold tracking-tight">SuprimaLabs</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
             <a href="#products" className="hover:text-foreground">Products</a>
            <a href="#mission" className="hover:text-foreground">Mission</a>
            <a href="#team" className="hover:text-foreground">Team</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="container py-24 md:py-32 max-w-4xl">
          <p className="text-sm font-medium text-primary mb-4">SuprimaLabs</p>
          <h1 className="text-4xl md:text-6xl font-semibold leading-[1.05] mb-6">
            Helping people understand and advocate for their own health.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-8">
            We build calm, intelligent tools that turn scattered health moments — symptoms, medicines, visits and lab results —
            into a story people can act on, together with their doctors.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg"><a href="#products">Explore our products <ArrowRight className="h-4 w-4 ml-1" /></a></Button>
            <Button asChild size="lg" variant="outline"><a href="#mission">Our mission</a></Button>
          </div>
        </section>

             <section id="products" className="container py-20">
          <h2 className="text-sm font-medium text-primary mb-3">Products</h2>
          <div className="rounded-2xl border bg-card p-8 md:p-10 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xl font-semibold">Pulse Journal</span>
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">Women's health</span>
              </div>
              <p className="text-muted-foreground mb-6">
                A health journal built for women. Women's symptoms are too often dismissed, under-researched and misdiagnosed —
                Pulse helps you track our mental and physical health, symptoms, pain and mood in your own words, spot patterns and correlation among symptoms, and
                walk into every appointment with evidence that gets you heard.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {pulseFeatures.map(({ icon: Icon, t }) => (
                <div key={t} className="rounded-xl bg-muted p-4 text-sm flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary shrink-0" /> {t}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 grid md:grid-cols-3 gap-4 text-sm">
            {[
              ["Dismissed for too long", "Women wait longer for diagnosis across hundreds of conditions."],
              ["Under-researched", "Women were routinely left out of clinical trials until the 1990s."],
              ["Life stages overlooked", "Periods, pregnancy and menopause shape health but are rarely tracked together."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <div className="font-semibold mb-1">{t}</div>
                <p className="text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">More products in development.</p>
        </section>


        <section id="mission" className="border-t bg-card/40">
          <div className="container py-20 grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-sm font-medium text-primary mb-3">Our mission</h2>
              <p className="text-2xl md:text-3xl font-semibold leading-snug">
                Every person deserves to walk into a doctor's office with a clear picture of their own health — and walk out understanding what comes next.
              </p>
            </div>
            <div className="space-y-5">
              {values.map(({ icon: Icon, t, d }) => (
                <div key={t} className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t}</h3>
                    <p className="text-sm text-muted-foreground">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        <section id="team" className="border-t bg-card/40">
          <div className="container py-20">
            <h2 className="text-sm font-medium text-primary mb-3">The people behind it</h2>
            <p className="text-2xl font-semibold mb-10 max-w-2xl">A small team of researchers, designers and engineers who care about patient voice.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {team.map((p) => (
                <div key={p.name} className="rounded-xl border bg-card p-6">
                  <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold mb-4">{initials(p.name)}</div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-sm text-primary mb-2">{p.role}</p>
                  <p className="text-sm text-muted-foreground">{p.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="container py-20 text-center max-w-2xl">
          <h2 className="text-3xl font-semibold mb-4">Let's talk</h2>
          <p className="text-muted-foreground mb-8">Partners, clinicians, researchers and investors — we'd love to hear from you.</p>
          <Button asChild size="lg"><a href="mailto:hello@suprimalabs.com"><Mail className="h-4 w-4 mr-2" /> hello@suprimalabs.com</a></Button>
        </section>
      </main>

      <footer className="border-t">
        <div className="container py-8 flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} SuprimaLabs. All rights reserved.</span>
          <span>Our products do not provide medical advice. In an emergency, call 911.</span>
        </div>
      </footer>
    </div>
  );
}
