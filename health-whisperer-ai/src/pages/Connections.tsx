import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Mail, HardDrive, Check, Loader2, Plug, Paperclip, CalendarPlus, CalendarClock, Apple } from "lucide-react";
import { toast } from "sonner";
import ExplainNoteDialog from "@/components/ExplainNoteDialog";
import {
  MOCK_ACCOUNT, MOCK_CALENDAR, MOCK_DRIVE, MOCK_GMAIL,
  MOCK_OUTLOOK_ACCOUNT, MOCK_OUTLOOK_CALENDAR, MOCK_APPLE_ACCOUNT, MOCK_APPLE_CALENDAR,
  dateFromOffset, loadConnections, saveConnections,
  type MockConnections, type MockCalendarEvent,
} from "@/lib/mockGoogle";

function CalendarStubCard({
  icon, title, description, account, events, connected, onToggle, onImport, busy, importedIds,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  account: string;
  events: MockCalendarEvent[];
  connected: boolean;
  onToggle: () => void;
  onImport: (ids?: string[]) => void;
  busy: boolean;
  importedIds: Set<string>;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">{icon} {title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            {connected ? (
              <Badge variant="secondary" className="gap-1"><Check className="h-3 w-3" /> Connected</Badge>
            ) : (
              <Badge variant="outline">Not connected</Badge>
            )}
            <Button size="sm" variant={connected ? "outline" : "default"} onClick={onToggle}>
              {connected ? "Disconnect" : "Connect"}
            </Button>
          </div>
        </div>
      </CardHeader>
      {connected && (
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Sample calendar for {account}.</p>
          <div className="space-y-2">
            {events.map((e) => {
              const start = dateFromOffset(e.offsetDays, e.time);
              const done = importedIds.has(e.id);
              return (
                <div key={e.id} className="flex items-center justify-between gap-3 border-b last:border-0 pb-2 last:pb-0">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{e.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {start.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      {e.location ? ` · ${e.location}` : ""}
                    </div>
                  </div>
                  {done ? (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                      <Check className="h-3.5 w-3.5 text-primary" /> Imported
                    </span>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => onImport([e.id])} disabled={busy}>
                      <CalendarPlus className="h-4 w-4 mr-1.5" /> Import
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          <Button size="sm" onClick={() => onImport()} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Import all upcoming
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

export default function Connections() {
  const { user } = useAuth();
  const [conn, setConn] = useState<MockConnections>(() => loadConnections());
  const [busy, setBusy] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  useEffect(() => { saveConnections(conn); }, [conn]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("schedule_items")
      .select("external_id")
      .not("external_id", "is", null)
      .then(({ data }) => setImportedIds(new Set((data ?? []).map((r: any) => r.external_id))));
  }, [user]);

  const toggle = (key: "calendar" | "drive" | "gmail" | "outlook" | "apple") => {
    const next = { ...conn, [key]: !conn[key] };
    setConn(next);
    toast.success(next[key] ? `Connected ${MOCK_ACCOUNT} (sample data)` : "Disconnected");
  };

  const importEvents = async (
    ids?: string[],
    opts: { list?: typeof MOCK_CALENDAR; source?: string; busyKey?: string } = {},
  ) => {
    if (!user) return;
    const list = opts.list ?? MOCK_CALENDAR;
    const source = opts.source ?? "google_calendar";
    const busyKey = opts.busyKey ?? "calendar";
    setBusy(busyKey);
    const events = list.filter((e) => (ids ? ids.includes(e.id) : true) && !importedIds.has(e.id));
    if (!events.length) { setBusy(null); return toast.info("Everything is already imported"); }
    const rows = events.map((e) => {
      const start = dateFromOffset(e.offsetDays, e.time);
      return {
        user_id: user.id,
        kind: e.kind,
        title: e.title,
        start_at: start.toISOString(),
        end_at: new Date(start.getTime() + e.durationMin * 60000).toISOString(),
        all_day: false,
        location: e.location ?? null,
        notes: e.notes ?? null,
        source,
        external_provider: `${source}_mock`,
        external_id: e.id,
      };
    });
    const { error } = await supabase.from("schedule_items").insert(rows);
    setBusy(null);
    if (error) return toast.error(error.message);
    setImportedIds((s) => new Set([...s, ...events.map((e) => e.id)]));
    toast.success(`${rows.length} event${rows.length > 1 ? "s" : ""} added to your schedule`);
  };

  const importFromEmail = async (msgId: string) => {
    const msg = MOCK_GMAIL.find((m) => m.id === msgId);
    if (!msg?.detected || !user) return;
    setBusy(msgId);
    const start = dateFromOffset(msg.detected.offsetDays, msg.detected.time);
    const { error } = await supabase.from("schedule_items").insert({
      user_id: user.id,
      kind: "appointment",
      title: msg.detected.title,
      start_at: start.toISOString(),
      end_at: new Date(start.getTime() + 30 * 60000).toISOString(),
      location: msg.detected.location ?? null,
      notes: `From email: ${msg.subject}`,
      source: "gmail",
      external_provider: "google_mock",
      external_id: msg.id,
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    setImportedIds((s) => new Set([...s, msg.id]));
    toast.success("Appointment added to your schedule");
  };

  const Status = ({ on }: { on: boolean }) =>
    on ? (
      <Badge variant="secondary" className="gap-1"><Check className="h-3 w-3" /> Connected</Badge>
    ) : (
      <Badge variant="outline">Not connected</Badge>
    );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Connections</h1>
        <p className="text-sm text-muted-foreground">
          Google Calendar, Gmail, and Drive — running on sample data so you can see how each feature behaves. No real
          Google account is touched yet.
        </p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-5 text-sm flex gap-3">
          <Plug className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>
            Demo mode: every item below is artificially generated for <span className="font-medium">{MOCK_ACCOUNT}</span>.
            Imported appointments are real rows in your schedule, so reminders and visit prep work end to end.
          </span>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> Google Calendar
              </CardTitle>
              <CardDescription>Import upcoming appointments and workouts, and pre-fill reminders.</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Status on={conn.calendar} />
              <Button size="sm" variant={conn.calendar ? "outline" : "default"} onClick={() => toggle("calendar")}>
                {conn.calendar ? "Disconnect" : "Connect"}
              </Button>
            </div>
          </div>
        </CardHeader>
        {conn.calendar && (
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {MOCK_CALENDAR.map((e) => {
                const start = dateFromOffset(e.offsetDays, e.time);
                const done = importedIds.has(e.id);
                return (
                  <div key={e.id} className="flex items-center justify-between gap-3 border-b last:border-0 pb-2 last:pb-0">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{e.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {start.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                        {e.location ? ` · ${e.location}` : ""}
                      </div>
                    </div>
                    {done ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                        <Check className="h-3.5 w-3.5 text-primary" /> Imported
                      </span>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => importEvents([e.id])} disabled={busy === "calendar"}>
                        <CalendarPlus className="h-4 w-4 mr-1.5" /> Import
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            <Button size="sm" onClick={() => importEvents()} disabled={busy === "calendar"}>
              {busy === "calendar" && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Import all upcoming
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Outlook Calendar */}
      <CalendarStubCard
        icon={<CalendarClock className="h-4 w-4 text-primary" />}
        title="Outlook Calendar"
        description="Pull work-calendar appointments and wellness sessions into your schedule."
        account={MOCK_OUTLOOK_ACCOUNT}
        events={MOCK_OUTLOOK_CALENDAR}
        connected={conn.outlook}
        onToggle={() => toggle("outlook")}
        onImport={(ids) => importEvents(ids, { list: MOCK_OUTLOOK_CALENDAR, source: "outlook_calendar", busyKey: "outlook" })}
        busy={busy === "outlook"}
        importedIds={importedIds}
      />

      {/* Apple Calendar */}
      <CalendarStubCard
        icon={<Apple className="h-4 w-4 text-primary" />}
        title="Apple Calendar (iCloud)"
        description="Bring in iPhone calendar events — dentist visits, classes, meditation reminders."
        account={MOCK_APPLE_ACCOUNT}
        events={MOCK_APPLE_CALENDAR}
        connected={conn.apple}
        onToggle={() => toggle("apple")}
        onImport={(ids) => importEvents(ids, { list: MOCK_APPLE_CALENDAR, source: "apple_calendar", busyKey: "apple" })}
        busy={busy === "apple"}
        importedIds={importedIds}
      />

      {/* Gmail */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" /> Gmail
              </CardTitle>
              <CardDescription>Spot appointment confirmations, results notices, and refill reminders.</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Status on={conn.gmail} />
              <Button size="sm" variant={conn.gmail ? "outline" : "default"} onClick={() => toggle("gmail")}>
                {conn.gmail ? "Disconnect" : "Connect"}
              </Button>
            </div>
          </div>
        </CardHeader>
        {conn.gmail && (
          <CardContent className="space-y-3">
            {MOCK_GMAIL.map((m) => (
              <div key={m.id} className="space-y-1.5 border-b last:border-0 pb-3 last:pb-0">
                <div className="flex justify-between gap-3">
                  <div className="text-sm font-medium">{m.subject}</div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {dateFromOffset(m.receivedOffsetDays).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{m.from}</div>
                <p className="text-sm text-muted-foreground">{m.snippet}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {m.detected && (
                    importedIds.has(m.id) ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="h-3.5 w-3.5 text-primary" /> Added to schedule
                      </span>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => importFromEmail(m.id)} disabled={busy === m.id}>
                        {busy === m.id
                          ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          : <CalendarPlus className="h-4 w-4 mr-1.5" />}
                        Add appointment
                      </Button>
                    )
                  )}
                  {m.attachment && (
                    <ExplainNoteDialog
                      documentName={m.attachment.name}
                      text={m.attachment.text}
                      kind={m.attachment.kind}
                      label={`Explain ${m.attachment.name}`}
                      variant="ghost"
                    />
                  )}
                  {m.attachment && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Paperclip className="h-3.5 w-3.5" /> {m.attachment.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Drive */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-primary" /> Google Drive
              </CardTitle>
              <CardDescription>Link a folder of reports and notes instead of re-uploading them.</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Status on={conn.drive} />
              <Button size="sm" variant={conn.drive ? "outline" : "default"} onClick={() => toggle("drive")}>
                {conn.drive ? "Disconnect" : "Connect"}
              </Button>
            </div>
          </div>
        </CardHeader>
        {conn.drive && (
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={conn.driveFolder}
                onChange={(e) => setConn({ ...conn, driveFolder: e.target.value })}
                placeholder="Folder name or share link (e.g. My Drive / Health)"
              />
            </div>
            <div className="space-y-2">
              {MOCK_DRIVE.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-3 border-b last:border-0 pb-2 last:pb-0">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{f.name}</div>
                    <div className="text-xs text-muted-foreground">{f.mimeLabel} · {f.sizeLabel}</div>
                  </div>
                  <ExplainNoteDialog documentName={f.name} text={f.text} kind={f.kind} label="Explain" variant="ghost" />
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
