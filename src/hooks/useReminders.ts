import { useEffect, useRef } from "react";

type Reminded = Record<string, number>;
const KEY = "pj_reminders_v1";

function loadReminded(): Reminded {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { return {}; }
}
function saveReminded(r: Reminded) {
  // prune entries older than 24h
  const cutoff = Date.now() - 86400000;
  const next: Reminded = {};
  for (const [k, v] of Object.entries(r)) if (v > cutoff) next[k] = v;
  localStorage.setItem(KEY, JSON.stringify(next));
}

export type Remindable = {
  id: string;
  title: string;
  start_at: string | null;
  done: boolean;
  location?: string | null;
};

/**
 * Schedules browser notifications for upcoming items while the tab is open.
 * Fires once per item, 15 minutes before start (or immediately if already < 15min away).
 * Persists "already reminded" in localStorage so duplicate notifications don't fire.
 *
 * Note: this only fires while the page is open. For true background reminders, the user
 * needs to install the app (PWA) and we'd add web push — that's a separate step.
 */
export function useReminders(items: Remindable[]) {
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    // Clear previous timers
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];

    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const reminded = loadReminded();
    const now = Date.now();
    const LEAD_MS = 15 * 60 * 1000;

    for (const item of items) {
      if (item.done || !item.start_at) continue;
      const start = new Date(item.start_at).getTime();
      if (isNaN(start)) continue;
      if (start < now) continue; // past
      if (reminded[item.id]) continue; // already notified
      if (start - now > 12 * 3600 * 1000) continue; // only schedule within 12h window

      const fireAt = Math.max(0, start - now - LEAD_MS);
      const timer = window.setTimeout(() => {
        try {
          const minutes = Math.max(1, Math.round((new Date(item.start_at!).getTime() - Date.now()) / 60000));
          new Notification("Pulse Journal reminder", {
            body: `${item.title} in ${minutes} min${item.location ? ` · ${item.location}` : ""}`,
            tag: `pulse-${item.id}`,
          });
          const r = loadReminded();
          r[item.id] = Date.now();
          saveReminded(r);
        } catch {/* ignore */}
      }, fireAt);
      timersRef.current.push(timer);
    }

    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, [items]);
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return await Notification.requestPermission();
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}
