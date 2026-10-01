import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpenCheck, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export type Explanation = {
  title?: string;
  plain_summary?: string;
  key_points?: string[];
  glossary?: { term: string; meaning: string }[];
  numbers?: { label: string; value: string; reference_range?: string; plain_meaning?: string }[];
  questions_for_doctor?: string[];
  watch_for?: string[];
  references?: { title: string; source: string; url: string }[];
  disclaimer?: string;
};

type Props = {
  label?: string;
  documentName: string;
  /** Plain text of the note (mock Drive/Gmail docs). */
  text?: string;
  /** Storage path of an uploaded image or PDF. */
  storagePath?: string;
  kind?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm";
};

export default function ExplainNoteDialog({
  label = "Explain in plain language",
  documentName,
  text,
  storagePath,
  kind,
  variant = "outline",
  size = "sm",
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exp, setExp] = useState<Explanation | null>(null);

  const run = async () => {
    setOpen(true);
    if (exp) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("explain-note", {
      body: { text, storage_path: storagePath, kind },
    });
    setLoading(false);
    if (error) { toast.error(error.message); setOpen(false); return; }
    if ((data as any)?.error) { toast.error(String((data as any).error)); setOpen(false); return; }
    setExp(data as Explanation);
  };

  const List = ({ title, items }: { title: string; items?: string[] }) =>
    items?.length ? (
      <div>
        <h4 className="text-sm font-medium mb-1.5">{title}</h4>
        <ul className="space-y-1 text-sm">
          {items.map((s, i) => (
            <li key={i} className="flex gap-2"><span className="text-primary">•</span><span>{s}</span></li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant={variant} size={size} onClick={run}>
        <BookOpenCheck className="h-4 w-4 mr-1.5" /> {label}
      </Button>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-6">{exp?.title || documentName}</DialogTitle>
          <DialogDescription>Plain-language explanation with references from trusted health sources.</DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="py-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading the document…
          </div>
        )}

        {!loading && exp && (
          <div className="space-y-4">
            {exp.plain_summary && <p className="text-sm leading-relaxed">{exp.plain_summary}</p>}

            <List title="What it says" items={exp.key_points} />

            {exp.numbers?.length ? (
              <div>
                <h4 className="text-sm font-medium mb-1.5">Your numbers</h4>
                <div className="space-y-2">
                  {exp.numbers.map((n, i) => (
                    <div key={i} className="rounded-lg border p-2.5 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="font-medium">{n.label}</span>
                        <span>{n.value}</span>
                      </div>
                      {n.reference_range && (
                        <div className="text-xs text-muted-foreground">Typical range: {n.reference_range}</div>
                      )}
                      {n.plain_meaning && <div className="text-xs mt-1">{n.plain_meaning}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {exp.glossary?.length ? (
              <div>
                <h4 className="text-sm font-medium mb-1.5">Words explained</h4>
                <dl className="space-y-1.5 text-sm">
                  {exp.glossary.map((g, i) => (
                    <div key={i}>
                      <dt className="font-medium inline">{g.term}: </dt>
                      <dd className="inline text-muted-foreground">{g.meaning}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            <List title="Questions to ask your doctor" items={exp.questions_for_doctor} />
            <List title="When to call sooner" items={exp.watch_for} />

            {exp.references?.length ? (
              <div className="pt-2 border-t">
                <h4 className="text-sm font-medium mb-1.5">References</h4>
                <ul className="space-y-1.5 text-sm">
                  {exp.references.map((r, i) => (
                    <li key={i}>
                      <a href={r.url} target="_blank" rel="noreferrer"
                         className="text-primary hover:underline inline-flex items-start gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>{r.title} <span className="text-muted-foreground">— {r.source}</span></span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground">{exp.disclaimer}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
