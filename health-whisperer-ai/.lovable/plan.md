# Plan: Close the gaps without crossing the HIPAA line

Scope rule: everything below is **consumer wellness**, not a medical record of truth. No clinician accounts, no provider-side dashboards, no PHI sharing infrastructure, no "send to my doctor" backend integrations. The user can always download or copy something and hand it over themselves — that stays outside HIPAA.

## What we'll build

### 1. Daily check-in + lightweight vitals log
A 15-second screen the user can open each morning/evening to log mood, sleep hours, energy, and any quick symptoms — without writing a full journal entry. Feeds the same Timeline and Insights.

- New "Today" card on the Journal page with: mood emoji, sleep slider, energy slider, optional symptom chips.
- Saves as a lightweight entry (`entry_type: 'check_in'`) so Timeline can show it differently from full journal entries.
- Streak counter ("5 days in a row") for gentle engagement.

### 2. Manual vitals + wearable-style data entry
Instead of Apple Health API (which pulls us toward HIPAA territory once we store device-sourced clinical data at scale), let users **type or paste** vitals: BP, weight, resting HR, steps, sleep. Optional CSV import from Apple Health / Fitbit exports the user downloads themselves.

- New `vitals` table (user_id, type, value, unit, recorded_at).
- Quick-add UI on the Journal page ("Log BP", "Log weight").
- CSV import screen: drop a file the user exported from their own device, we parse client-side and insert.
- Charts on Insights: trend lines for weight, BP, sleep.

### 3. Visit prep + visit summary PDF
The most-requested journaling outcome: walk into a doctor's office prepared, walk out with notes.

- **Before a visit**: "Prep for visit" button generates a one-page printable from the last 30 days — current meds, recent symptoms, questions to ask (AI suggests 3-5 based on entries).
- **After a visit**: existing journal entry → "Export visit summary" → PDF the user can save, email, or print. Plain consumer document, no e-signature, no provider transmission.

### 4. Smarter Insights with pattern detection
Today Insights is a single AI report. Make it richer using existing data.

- Symptom-trigger correlations ("headaches cluster on <6h sleep nights").
- Mood trend over time.
- Med adherence reminders ("you mentioned skipping lisinopril twice this week").
- "Talk to a doctor about…" gentle prompts when a pattern recurs 3+ times.

### 5. Reminders (browser/PWA notifications)
Med reminders and daily check-in nudges via the Web Notifications API. No SMS, no email infra — keeps it free and trivially deployable.

- Per-medication schedule → local notification.
- Daily check-in reminder at a user-picked time.

### 6. Family history capture
Powers better suggestions (already referenced by the AI prompt, but not collected today).

- One-time onboarding card: "Any conditions that run in your family?" with common chips (heart, diabetes, cancer, mental health) + free text.
- Stored on `profiles`, fed into every `parse-entry` call.

## What we are NOT building (HIPAA-adjacent)

- No provider portal, no clinician login, no "your doctor can view this" link.
- No direct Apple Health / Google Fit OAuth ingestion of clinical data (CSV import only, user-driven).
- No telehealth booking or insurance verification integrations.
- No storing scanned lab PDFs as a system of record — attachments stay personal notes.
- No symptom-checker "diagnosis" language — keep it suggestion-only with disclaimers.

## Technical notes

### Database
- `vitals` table: `id, user_id, type, value numeric, unit, recorded_at, source ('manual'|'import'), created_at`. RLS scoped to `user_id`, plus the demo-user anon policy mirroring existing tables.
- Extend `entries` with `entry_type text default 'journal'` to distinguish full entries from quick check-ins.
- Extend `profiles` with `family_history jsonb`, `reminder_time time`, `streak_count int`.

### Edge functions
- New `visit-prep`: takes last 30 days of entries + meds, returns suggested questions + structured summary for the prep PDF.
- New `insights-patterns`: runs deterministic correlations (mood vs sleep, symptom frequency) before calling AI for narrative — cheaper and more reliable than pure-LLM analysis.
- Extend `parse-entry` to receive `family_history` from profile.

### Frontend
- PDF generation: `@react-pdf/renderer` client-side (no server PDF service needed).
- Notifications: `Notification.requestPermission()` + a small service worker for scheduled triggers.
- CSV parsing: `papaparse`, all client-side.
- New routes: `/vitals`, `/visit-prep`. Insights gets new chart components.

### Order of work
1. Family history capture + `vitals` table + manual vitals entry (foundation).
2. Daily check-in card + streak.
3. Visit prep + visit summary PDF.
4. Insights patterns + charts.
5. Reminders + CSV import (polish).

## Disclaimers shown in-app
- Onboarding: "Pulse Journal is a personal wellness tool, not a medical device. It doesn't diagnose, treat, or replace professional care."
- Every AI suggestion card already carries "This isn't medical advice" — keep it.

Want me to proceed with all six, or trim to a smaller first slice (e.g. just 1 + 3 + 6)?
