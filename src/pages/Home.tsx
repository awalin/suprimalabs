import { Link, Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import ContactForm from "@/components/ContactForm";
import {
  Activity, BookOpen, Sparkles, ClipboardList, FolderOpen, Stethoscope, ArrowRight, Compass, Shield, HandHeart, Mail,
  FlaskConical, Users, Lightbulb, Microscope, Briefcase, CheckCircle2,
} from "lucide-react";

const values = [
  { icon: HandHeart, t: "People first", d: "We design for patients and caregivers — not for billing codes." },
  { icon: Shield, t: "Private by design", d: "Your health story belongs to you. We read records, never write them." },
  { icon: Compass, t: "Evidence, explained", d: "Plain-language guidance linked to trusted medical sources." },
];

const approach = [
  { icon: Lightbulb, t: "Listen", d: "We start from lived experience — interviews with patients, caregivers and clinicians." },
  { icon: FlaskConical, t: "Build", d: "Small, careful releases with AI that explains itself and cites its sources." },
  { icon: Microscope, t: "Measure", d: "We study whether people feel more heard and better prepared — and publish what we learn." },
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
  { name: "Awalin Sopan", role: "Founder & CEO", bio: "Leads product, research and strategy. Focused on giving patients — especially women — a clearer voice in their care." },
  { name: "Clinical Lead", role: "Women's health clinician", bio: "Guides medical accuracy, safety review and the evidence behind every suggestion.", open: true },
  { name: "Engineering Lead", role: "AI & platform", bio: "Owns the journal engine, record imports and privacy-first infrastructure.", open: true },
  { name: "Design Lead", role: "Product & research design", bio: "Runs user studies and shapes a calm, trauma-informed experience.", open: true },
];

const advisors = [
  { t: "Clinical advisory board", d: "OB-GYN, primary care and mental health advisors — forming now." },
  { t: "Patient advisory council", d: "Women across life stages who test and shape every release." },
  { t: "Research partners", d: "Academic collaborators for NIH SBIR-funded usability and outcome studies." },
];

const milestones = [
  ["Now", "Pulse Journal demo live with journaling, visit prep and record import."],
  ["Next", "Pilot study with women navigating perimenopause and chronic symptoms."],
  ["Later", "Mobile apps, caregiver sharing and new products for under-served conditions."],
];

const initials = (n: string) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

export default function Home() {
  // Inside the Google Play app, skip the company page and open the journal.
  if (Capacitor.isNativePlatform()) return <Navigate to="/journal" replace />;
  return (
    <div className="theme-vibrant min-h-screen bg-background text-foreground">
      <header className="border-b bg-card/70 backdrop-blur sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <a href="#top" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-glow">S</div>
            <span className="font-semibold tracking-tight">SuprimaLabs</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#mission" className="hover:text-medical">Mission</a>
            <a href="#products" className="hover:text-medical">Pulse Journal</a>
            <a href="#approach" className="hover:text-medical">Approach</a>
            <a href="#team" className="hover:text-medical">Team</a>
            <a href="#careers" className="hover:text-medical">Careers</a>
            <a href="#contact" className="hover:text-medical">Contact</a>
          </nav>
          <Button asChild size="sm" className="rounded-full bg-gradient-primary shadow-glow hover:opacity-90"><Link to="/pulse">Explore Pulse Journal</Link></Button>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden bg-hero-vibrant">
          <div className="container py-10 md:py-14 grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12 items-center">
            <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground mb-4">
              <Sparkles className="h-4 w-4" /> SuprimaLabs · Health technology
            </p>
            <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold leading-[1.05] mb-5">
              Your health. Your voice. <span className="text-gradient">Your power.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-8">
              We build joyful, intelligent tools that turn scattered health moments — symptoms, medicines, visits and lab results —
              into a story you can act on, together with your doctors. Our first focus: women's health.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-gradient-primary shadow-glow hover:opacity-90"><Link to="/pulse">Explore Pulse Journal <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-medical/40 hover:bg-primary/10"><a href="#mission">Our mission</a></Button>
            </div>
            </div>
            <div id="products" className="rounded-3xl border bg-card p-6 md:p-7 shadow-glow space-y-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-medical">Flagship product</p>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-lg bg-medical/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-medical" />
                </div>
                <span className="text-xl font-semibold">Pulse Journal</span>
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">Women's health</span>
              </div>
              <p className="text-muted-foreground mb-5 text-sm">
                A health journal built for women. Women's symptoms are too often dismissed, under-researched and misdiagnosed —
                Pulse helps you track cycles, perimenopause, pregnancy, pain and mood in your own words, spot patterns, and
                walk into every appointment with evidence that gets you heard.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild><Link to="/pulse">Explore Pulse Journal <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {pulseFeatures.map(({ icon: Icon, t }) => (
                <div key={t} className="rounded-xl bg-secondary p-3 text-sm font-medium flex items-center gap-2">
                  <Icon className="h-4 w-4 text-medical shrink-0" /> {t}
                </div>
              ))}
            </div>
            </div>
          </div>
        </section>

        <section id="mission" className="border-t bg-card/40">
          <div className="container py-20 grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-sm font-medium text-medical mb-3">Our mission</h2>
              <p className="text-2xl md:text-3xl font-semibold leading-snug">
                Every person deserves to walk into a doctor's office with a clear picture of their own health — and walk out understanding what comes next.
              </p>
            </div>
            <div className="space-y-5">
              {values.map(({ icon: Icon, t, d }) => (
                <div key={t} className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-medical/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-medical" />
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

        <section className="container py-16">
          <h2 className="text-sm font-medium text-medical mb-3">Why women's health</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-4 text-sm">
            {[
              ["Dismissed for too long", "Women wait longer for diagnosis across hundreds of conditions."],
              ["Under-researched", "Women were routinely left out of clinical trials until the 1990s."],
              ["Life stages overlooked", "Periods, pregnancy and menopause shape health but are rarely tracked together."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-medical/20 bg-medical/5 p-5">
                <div className="font-semibold mb-1">{t}</div>
                <p className="text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">More products in development.</p>
        </section>

        <section id="approach" className="border-t bg-card/40">
          <div className="container py-20">
            <h2 className="text-sm font-medium text-medical mb-3">How we work</h2>
            <p className="text-2xl font-semibold mb-10 max-w-2xl">Research-led, patient-tested, evidence-linked.</p>
            <div className="grid md:grid-cols-3 gap-6">
              {approach.map(({ icon: Icon, t, d }) => (
                <div key={t} className="rounded-xl border bg-card p-6">
                  <Icon className="h-6 w-6 text-medical mb-3" />
                  <h3 className="font-semibold mb-1">{t}</h3>
                  <p className="text-sm text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 grid md:grid-cols-3 gap-4">
              {milestones.map(([k, d]) => (
                <div key={k} className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-medical shrink-0 mt-0.5" />
                  <div><div className="font-semibold">{k}</div><p className="text-sm text-muted-foreground">{d}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="team" className="container py-20">
          <h2 className="text-sm font-medium text-medical mb-3">The people behind it</h2>
          <p className="text-2xl font-semibold mb-10 max-w-2xl">A small team of researchers, clinicians, designers and engineers who care about patient voice.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((p) => (
              <div key={p.name} className="rounded-xl border bg-card p-6">
                <div className="h-14 w-14 rounded-full bg-medical/10 text-medical flex items-center justify-center font-semibold mb-4">
                  {p.open ? <Users className="h-6 w-6" /> : initials(p.name)}
                </div>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-medical mb-2">{p.role}</p>
                <p className="text-sm text-muted-foreground">{p.bio}</p>
                {p.open && <a href="#careers" className="mt-3 inline-block text-xs font-medium text-medical hover:underline">Joining soon · We're hiring</a>}
              </div>
            ))}
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {advisors.map(({ t, d }) => (
              <div key={t} className="rounded-xl bg-muted p-5">
                <div className="font-semibold mb-1">{t}</div>
                <p className="text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="careers" className="border-t bg-card/40">
          <div className="container py-20 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-sm font-medium text-medical mb-3">Careers</h2>
              <p className="text-2xl font-semibold mb-3">Help women get heard.</p>
              <p className="text-muted-foreground">We're looking for a women's health clinician, an AI engineer and a product designer who want their work to matter.</p>
            </div>
            <div className="flex md:justify-end">
              <Button asChild size="lg" variant="outline"><a href="#contact"><Briefcase className="h-4 w-4 mr-2" /> Get in touch</a></Button>
            </div>
          </div>
        </section>

        <section id="contact" className="bg-hero-vibrant"><div className="container py-20 text-center max-w-2xl">
          <h2 className="text-3xl font-semibold mb-4">Let's talk</h2>
          <p className="text-muted-foreground mb-8">Partners, clinicians, researchers and investors — we'd love to hear from you.</p>
          <ContactForm />
        </div></section>
      </main>

      <footer className="border-t">
        <div className="container py-8 flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} SuprimaLabs. All rights reserved. · <Link to="/pulse" className="hover:text-foreground">Pulse Journal</Link> · <Link to="/privacy" className="hover:text-foreground">Privacy</Link> · <Link to="/terms" className="hover:text-foreground">Terms</Link></span>
          <span>Our products do not provide medical advice. In an emergency, call 911.</span>
        </div>
      </footer>
    </div>
  );
}
