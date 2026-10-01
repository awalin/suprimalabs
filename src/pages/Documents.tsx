import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Image as ImageIcon, Upload, Loader2, Trash2, Sparkles, HardDrive, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import ExplainNoteDialog from "@/components/ExplainNoteDialog";
import { MOCK_DRIVE, MOCK_ACCOUNT, loadConnections, dateFromOffset } from "@/lib/mockGoogle";
import { Link } from "react-router-dom";

type Attachment = {
  id: string;
  storage_path: string;
  kind: string;
  ai_extracted: any;
  created_at: string;
};

const KINDS = [
  { v: "medicine", label: "Medicine photo" },
  { v: "prescription", label: "Prescription" },
  { v: "lab", label: "Lab / test report" },
  { v: "note", label: "Doctor's note" },
  { v: "document", label: "Other document" },
];

const kindLabel = (k: string) => KINDS.find((x) => x.v === k)?.label ?? k;

export default function Documents() {
  const { user } = useAuth();
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState("lab");
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const conn = loadConnections();

  const load = async () => {
    const { data } = await supabase
      .from("attachments")
      .select("id,storage_path,kind,ai_extracted,created_at")
      .order("created_at", { ascending: false });
    setItems((data ?? []) as Attachment[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const upload = async (files: FileList | null) => {
    if (!files?.length || !user) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      const safe = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${user.id}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from("health-attachments").upload(path, file);
      if (upErr) { toast.error(`${file.name}: ${upErr.message}`); continue; }
      const { error } = await supabase.from("attachments").insert({
        user_id: user.id,
        storage_path: path,
        kind,
      });
      if (error) { toast.error(error.message); continue; }
      ok++;
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (ok) { toast.success(`${ok} file${ok > 1 ? "s" : ""} uploaded`); load(); }
  };

  const extract = async (a: Attachment) => {
    setExtracting(a.id);
    const { data, error } = await supabase.functions.invoke("image-extract", {
      body: { storage_path: a.storage_path, kind: a.kind },
    });
    setExtracting(null);
    if (error) return toast.error(error.message);
    await supabase.from("attachments").update({ ai_extracted: data }).eq("id", a.id);
    setItems((xs) => xs.map((x) => (x.id === a.id ? { ...x, ai_extracted: data } : x)));
    toast.success("Details extracted");
  };

  const open = async (a: Attachment) => {
    const { data, error } = await supabase.storage.from("health-attachments").createSignedUrl(a.storage_path, 3600);
    if (error || !data) return toast.error("Could not open file");
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const del = async (a: Attachment) => {
    await supabase.storage.from("health-attachments").remove([a.storage_path]);
    await supabase.from("attachments").delete().eq("id", a.id);
    setItems((xs) => xs.filter((x) => x.id !== a.id));
  };

  const fileName = (p: string) => p.split("/").pop()?.replace(/^\d+-/, "") ?? p;
  const isPdf = (p: string) => p.toLowerCase().endsWith(".pdf");

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="text-sm text-muted-foreground">
          Photos of medicines, lab reports, prescriptions, PDFs — kept private to your account. Anything with clinical
          wording can be explained in plain language.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Upload</CardTitle>
          <CardDescription>Images (JPG, PNG, HEIC-converted) and PDFs up to 20 MB each.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => <SelectItem key={k.v} value={k.v}>{k.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5" />}
              {uploading ? "Uploading…" : "Choose files"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => upload(e.target.files)}
            />
          </div>
        </CardContent>
      </Card>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!loading && items.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Nothing here yet. Snap a photo of a medicine box or upload your latest lab PDF.
          </CardContent>
        </Card>
      )}

      {items.map((a) => (
        <Card key={a.id}>
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {isPdf(a.storage_path)
                    ? <FileText className="h-4 w-4 text-primary" />
                    : <ImageIcon className="h-4 w-4 text-primary" />}
                </div>
                <div className="min-w-0">
                  <button onClick={() => open(a)} className="text-sm font-medium truncate hover:underline text-left">
                    {fileName(a.storage_path)}
                  </button>
                  <div className="text-xs text-muted-foreground">
                    {kindLabel(a.kind)} · {new Date(a.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => del(a)} aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {a.ai_extracted?.summary && (
              <p className="text-sm text-muted-foreground border-l-2 border-primary/40 pl-3">{a.ai_extracted.summary}</p>
            )}

            <div className="flex flex-wrap gap-2">
              <ExplainNoteDialog
                documentName={fileName(a.storage_path)}
                storagePath={a.storage_path}
                kind={a.kind}
              />
              <Button variant="ghost" size="sm" onClick={() => extract(a)} disabled={extracting === a.id}>
                {extracting === a.id
                  ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  : <Sparkles className="h-4 w-4 mr-1.5" />}
                Extract details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-primary" /> Google Drive folder
            <Badge variant="secondary" className="ml-1">Sample data</Badge>
          </CardTitle>
          <CardDescription>
            {conn.drive
              ? <>Linked to <span className="font-medium">{conn.driveFolder || "My Drive / Health"}</span> as {MOCK_ACCOUNT}.</>
              : <>Not linked yet — connect it on the <Link to="/connections" className="text-primary hover:underline">Connections</Link> page.</>}
          </CardDescription>
        </CardHeader>
        {conn.drive && (
          <CardContent className="space-y-2">
            {MOCK_DRIVE.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-3 border-b last:border-0 pb-2 last:pb-0">
                <div className="flex gap-3 min-w-0">
                  <FolderOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{f.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {f.mimeLabel} · {f.sizeLabel} · modified{" "}
                      {dateFromOffset(f.modifiedOffsetDays).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </div>
                  </div>
                </div>
                <ExplainNoteDialog documentName={f.name} text={f.text} kind={f.kind} label="Explain" size="sm" variant="ghost" />
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
