import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

type Brief = {
  opening?: string;
  tell_the_doctor?: string[];
  questions?: string[];
  bring_up_medications?: string[];
  red_flags?: string[];
};

type Props = {
  scheduleItemId: string;
  itemTitle: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm";
};

export default function TellDoctorButton({ scheduleItemId, itemTitle, variant = "ghost", size = "sm" }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    if (!user) return;
    setOpen(true);
    if (brief) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("appointment-brief", {
      body: { user_id: user.id, schedule_item_id: scheduleItemId },
    });
    setLoading(false);
    if (error) { toast.error(error.message); setOpen(false); return; }
    setBrief((data as any)?.brief ?? {});
  };

  const asText = () => {
    if (!brief) return "";
    const parts: string[] = [`For: ${itemTitle}`, ""];
    if (brief.opening) parts.push(`Opening: ${brief.opening}`, "");
    if (brief.tell_the_doctor?.length) {
      parts.push("Tell the doctor:");
      brief.tell_the_doctor.forEach((s) => parts.push(`  • ${s}`));
      parts.push("");
    }
    if (brief.questions?.length) {
      parts.push("Questions to ask:");
      brief.questions.forEach((s, i) => parts.push(`  ${i + 1}. ${s}`));
      parts.push("");
    }
    if (brief.bring_up_medications?.length) {
      parts.push("Medications:");
      brief.bring_up_medications.forEach((s) => parts.push(`  • ${s}`));
      parts.push("");
    }
    if (brief.red_flags?.length) {
      parts.push("Don't forget to mention:");
      brief.red_flags.forEach((s) => parts.push(`  • ${s}`));
    }
    return parts.join("\n");
  };

  const copy = async () => {
    await navigator.clipboard.writeText(asText());
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  const Section = ({ title, items }: { title: string; items?: string[] }) =>
    items && items.length ? (
      <div>
        <h4 className="text-sm font-medium mb-1.5">{title}</h4>
        <ul className="space-y-1 text-sm">
          {items.map((s, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{s}</li>)}
        </ul>
      </div>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant={variant} size={size} onClick={load}>
        <MessageSquare className="h-4 w-4 mr-1.5" />
        What to tell the doctor
      </Button>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tell the doctor — {itemTitle}</DialogTitle>
          <DialogDescription>Based on your last 60 days of journal entries, meds, and vitals.</DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading your history…
          </div>
        )}

        {!loading && brief && (
          <div className="space-y-4">
            {brief.opening && (
              <div className="text-sm italic border-l-2 border-primary pl-3 text-foreground/80">
                "{brief.opening}"
              </div>
            )}
            <Section title="Tell the doctor" items={brief.tell_the_doctor} />
            <Section title="Questions to ask" items={brief.questions} />
            <Section title="About your medications" items={brief.bring_up_medications} />
            <Section title="Don't forget to mention" items={brief.red_flags} />

            <div className="flex justify-end pt-2 border-t">
              <Button size="sm" variant="outline" onClick={copy}>
                {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Not medical advice — a personal summary to start the conversation.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
