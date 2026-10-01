import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Check, CalendarClock, Download, Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import AddToCalendar from "@/components/AddToCalendar";
import TellDoctorButton from "@/components/TellDoctorButton";
import { downloadIcs, type IcsEvent } from "@/lib/ics";
import { useReminders, requestNotificationPermission, notificationPermission } from "@/hooks/useReminders";

type Item = {
  id: string;
  kind: string;
  title: string;
  start_at: string | null;
  end_at: string | null;
  all_day: boolean;
  location: string | null;
  notes: string | null;
  recurrence_rule: string | null;
  done: boolean;
};

const KIND_LABELS: Record<string, string> = {
  appointment: "Appointment",
  exercise: "Exercise",
  medication: "Medication",
  other: "Other",
};

function toIcsEvent(item: Item): IcsEvent | null {
  if (!item.start_at) return null;
  const start = new Date(item.start_at);
  if (isNaN(start.getTime())) return null;
  return {
    uid: `pulse-${item.id}@pulse.local`,
    title: item.title,
    start,
    end: item.end_at ? new Date(item.end_at) : undefined,
    allDay: item.all_day,
    location: item.location ?? undefined,
    description: item.notes ?? undefined,
    rrule: item.recurrence_rule ?? undefined,
  };
}

export default function Schedule() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState(notificationPermission());

  useReminders(items);

  // New item form
  const [kind, setKind] = useState("appointment");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [recurrence, setRecurrence] = useState("none");

  const load = async () => {
    const { data } = await supabase
      .from("schedule_items")
      .select("id,kind,title,start_at,end_at,all_day,location,notes,recurrence_rule,done")
      .order("start_at", { ascending: true });
    setItems((data ?? []) as Item[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const resetForm = () => {
    setKind("appointment"); setTitle(""); setStartDate(""); setStartTime("");
    setLocation(""); setNotes(""); setRecurrence("none");
  };

  const create = async () => {
    if (!user || !title.trim() || !startDate) return toast.error("Title and date required");
    const dt = startTime ? `${startDate}T${startTime}` : `${startDate}T09:00`;
    const start = new Date(dt);
    if (isNaN(start.getTime())) return toast.error("Invalid date");

    const rruleMap: Record<string, string> = {
      none: "",
      daily: "FREQ=DAILY",
      weekly: "FREQ=WEEKLY",
      "mon-wed-fri": "FREQ=WEEKLY;BYDAY=MO,WE,FR",
      weekdays: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
      monthly: "FREQ=MONTHLY",
    };

    const { error } = await supabase.from("schedule_items").insert({
      user_id: user.id,
      kind,
      title: title.trim(),
      start_at: start.toISOString(),
      all_day: !startTime,
      location: location.trim() || null,
      notes: notes.trim() || null,
      recurrence_rule: rruleMap[recurrence] || null,
      source: "manual",
    });
    if (error) return toast.error(error.message);
    toast.success("Added");
    setOpen(false);
    resetForm();
    load();
  };

  const toggleDone = async (item: Item) => {
    await supabase.from("schedule_items").update({ done: !item.done }).eq("id", item.id);
    setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, done: !x.done } : x)));
  };

  const del = async (id: string) => {
    await supabase.from("schedule_items").delete().eq("id", id);
    setItems((xs) => xs.filter((x) => x.id !== id));
  };

  const downloadAll = () => {
    const events = items.map(toIcsEvent).filter((e): e is IcsEvent => e !== null);
    if (!events.length) return toast.error("Nothing to export");
    downloadIcs("pulse-schedule", events);
  };

  const now = Date.now();
  const upcoming = items.filter((i) => !i.done && (!i.start_at || new Date(i.start_at).getTime() >= now - 86400000));
  const past = items.filter((i) => i.done || (i.start_at && new Date(i.start_at).getTime() < now - 86400000));

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
          <p className="text-sm text-muted-foreground">Appointments, workouts, and reminders — add them to your Google or Apple calendar with one click.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New schedule item</DialogTitle>
              <DialogDescription>Whatever you add here can be pushed to your calendar.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Select value={kind} onValueChange={setKind}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(KIND_LABELS).map(([k, l]) => (
                      <SelectItem key={k} value={k}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={recurrence} onValueChange={setRecurrence}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">One-time</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="mon-wed-fri">Mon / Wed / Fri</SelectItem>
                    <SelectItem value="weekdays">Weekdays</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Cardiology follow-up)" />
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="Optional" />
              </div>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (optional)" />
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" />
            </div>
            <DialogFooter>
              <Button onClick={create}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {items.length > 0 && (
        <Card>
          <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-3">
            <CardDescription className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4" /> Export everything to one .ics file
            </CardDescription>
            <div className="flex gap-2">
              {permission !== "unsupported" && permission !== "granted" && (
                <Button size="sm" variant="outline" onClick={async () => {
                  const p = await requestNotificationPermission();
                  setPermission(p);
                  if (p === "granted") toast.success("Reminders on — you'll be pinged 15 min before items");
                  else if (p === "denied") toast.error("Reminders blocked by browser");
                }}>
                  <Bell className="h-4 w-4 mr-1.5" /> Turn on reminders
                </Button>
              )}
              {permission === "granted" && (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-primary" /> Reminders on
                </div>
              )}
              {permission === "denied" && (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <BellOff className="h-3.5 w-3.5" /> Blocked in browser
                </div>
              )}
              <Button size="sm" variant="outline" onClick={downloadAll}>
                <Download className="h-4 w-4 mr-1.5" /> Export all
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {!loading && upcoming.length === 0 && past.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground text-sm">
            Nothing scheduled. Mention an appointment or workout in a journal entry and we'll pick it up — or add one above.
          </CardContent>
        </Card>
      )}

      {upcoming.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Upcoming</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map((i) => <ItemRow key={i.id} item={i} onToggle={toggleDone} onDelete={del} />)}
          </CardContent>
        </Card>
      )}

      {past.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base text-muted-foreground">Past / done</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {past.slice(0, 20).map((i) => <ItemRow key={i.id} item={i} onToggle={toggleDone} onDelete={del} muted />)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ItemRow({ item, onToggle, onDelete, muted }: { item: Item; onToggle: (i: Item) => void; onDelete: (id: string) => void; muted?: boolean }) {
  const ev = toIcsEvent(item);
  const when = item.start_at ? new Date(item.start_at) : null;
  return (
    <div className={`flex items-start justify-between gap-3 border-b last:border-0 pb-3 last:pb-0 ${muted ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <button
          onClick={() => onToggle(item)}
          className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center flex-shrink-0 ${
            item.done ? "bg-primary border-primary text-primary-foreground" : "border-input hover:bg-muted"
          }`}
          aria-label="Toggle done"
        >
          {item.done && <Check className="h-3 w-3" />}
        </button>
        <div className="min-w-0">
          <div className={`text-sm font-medium ${item.done ? "line-through" : ""}`}>{item.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-2">
            <Badge variant="outline" className="text-xs">{KIND_LABELS[item.kind] ?? item.kind}</Badge>
            {when && (
              <span>{when.toLocaleString(undefined, { dateStyle: "medium", timeStyle: item.all_day ? undefined : "short" })}</span>
            )}
            {item.recurrence_rule && <span>· repeats</span>}
            {item.location && <span>· {item.location}</span>}
          </div>
          {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
          {!muted && item.kind === "appointment" && (
            <div className="mt-2">
              <TellDoctorButton scheduleItemId={item.id} itemTitle={item.title} />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {ev && <AddToCalendar event={ev} variant="ghost" />}
        <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
