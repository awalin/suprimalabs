import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, Send } from "lucide-react";

const topics = ["General", "Partnership", "Clinician", "Research", "Investor", "Careers", "Early access"];

export default function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", topic: "General", message: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setState("sending");
    const { error } = await supabase.functions.invoke("contact-submit", { body: f });
    if (error) { setErr("Something went wrong. Please try again in a moment."); setState("idle"); return; }
    setState("sent");
  };

  if (state === "sent") return (
    <div className="rounded-3xl border bg-card p-8 text-center shadow-glow">
      <CheckCircle2 className="h-10 w-10 text-medical mx-auto mb-3" />
      <p className="text-lg font-semibold">Thank you — your message is on its way.</p>
      <p className="text-sm text-muted-foreground">We'll reply to {f.email} soon.</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="rounded-3xl border bg-card p-6 md:p-8 shadow-glow text-left space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="space-y-1.5 text-sm font-medium">Name<Input required maxLength={120} value={f.name} onChange={set("name")} /></label>
        <label className="space-y-1.5 text-sm font-medium">Email<Input required type="email" maxLength={200} value={f.email} onChange={set("email")} /></label>
      </div>
      <label className="block space-y-1.5 text-sm font-medium">Topic
        <select value={f.topic} onChange={set("topic")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          {topics.map((t) => <option key={t}>{t}</option>)}
        </select>
      </label>
      <label className="block space-y-1.5 text-sm font-medium">Message<Textarea required maxLength={5000} rows={5} value={f.message} onChange={set("message")} /></label>
      <input type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} className="hidden" aria-hidden="true" />
      {err && <p className="text-sm text-destructive">{err}</p>}
      <Button type="submit" size="lg" disabled={state === "sending"} className="w-full rounded-full bg-gradient-primary shadow-glow hover:opacity-90">
        {state === "sending" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />} Send message
      </Button>
    </form>
  );
}
