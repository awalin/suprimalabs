// Lightweight ICS (RFC 5545) generator — no dependencies.
// Works with Google Calendar, Apple Calendar, Outlook, Fastmail, etc.

export type IcsEvent = {
  uid: string;
  title: string;
  start: Date;
  end?: Date;
  allDay?: boolean;
  location?: string;
  description?: string;
  /** Raw RRULE without the "RRULE:" prefix, e.g. "FREQ=WEEKLY;BYDAY=MO,WE" */
  rrule?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

function fmtUtc(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function fmtDate(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate())
  );
}

function escape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

// Fold long lines per RFC 5545 (max 75 octets, continuation lines start with space).
function fold(line: string): string {
  if (line.length <= 75) return line;
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    out.push((i === 0 ? "" : " ") + line.slice(i, i + 74));
    i += 74;
  }
  return out.join("\r\n");
}

export function buildIcs(events: IcsEvent[]): string {
  const now = fmtUtc(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pulse Journal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const e of events) {
    const end = e.end ?? new Date(e.start.getTime() + 30 * 60 * 1000);
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.uid}`);
    lines.push(`DTSTAMP:${now}`);
    if (e.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${fmtDate(e.start)}`);
      lines.push(`DTEND;VALUE=DATE:${fmtDate(end)}`);
    } else {
      lines.push(`DTSTART:${fmtUtc(e.start)}`);
      lines.push(`DTEND:${fmtUtc(end)}`);
    }
    lines.push(fold(`SUMMARY:${escape(e.title)}`));
    if (e.location) lines.push(fold(`LOCATION:${escape(e.location)}`));
    if (e.description) lines.push(fold(`DESCRIPTION:${escape(e.description)}`));
    if (e.rrule) lines.push(`RRULE:${e.rrule}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(filename: string, events: IcsEvent[]) {
  const ics = buildIcs(events);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Google Calendar "create event" deep-link, opens in a new tab.
export function googleCalendarUrl(e: IcsEvent): string {
  const end = e.end ?? new Date(e.start.getTime() + 30 * 60 * 1000);
  const dates = e.allDay
    ? `${fmtDate(e.start)}/${fmtDate(end)}`
    : `${fmtUtc(e.start)}/${fmtUtc(end)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates,
    details: e.description ?? "",
    location: e.location ?? "",
  });
  if (e.rrule) params.append("recur", `RRULE:${e.rrule}`);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
