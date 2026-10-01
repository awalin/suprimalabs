/**
 * Mock Google Workspace data.
 *
 * These are sample values used to demo Gmail / Drive / Calendar integrations without
 * a real OAuth connection. Nothing here touches Google — swap these readers for real
 * API calls later and the UI keeps working unchanged.
 */

export type MockCalendarEvent = {
  id: string;
  title: string;
  /** days from today; negative = past */
  offsetDays: number;
  time: string; // HH:MM local
  durationMin: number;
  location?: string;
  notes?: string;
  kind: "appointment" | "exercise" | "other";
};

export type MockDriveFile = {
  id: string;
  name: string;
  mimeLabel: string;
  sizeLabel: string;
  modifiedOffsetDays: number;
  kind: "lab" | "note" | "prescription" | "document";
  /** Full text of the document, used by the plain-language explainer. */
  text: string;
};

export type MockGmailMessage = {
  id: string;
  from: string;
  subject: string;
  receivedOffsetDays: number;
  snippet: string;
  body: string;
  /** Optional appointment detected in the email. */
  detected?: { title: string; offsetDays: number; time: string; location?: string };
  attachment?: { name: string; kind: MockDriveFile["kind"]; text: string };
};

export const MOCK_ACCOUNT = "awalin.example@gmail.com";

export function dateFromOffset(offsetDays: number, time = "09:00"): Date {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const [h, m] = time.split(":").map(Number);
  d.setHours(h ?? 9, m ?? 0, 0, 0);
  return d;
}

export const MOCK_CALENDAR: MockCalendarEvent[] = [
  {
    id: "gcal-mock-001",
    title: "OB-GYN follow-up — Dr. Meera Patel",
    offsetDays: 2,
    time: "10:30",
    durationMin: 40,
    location: "Riverside Women's Health, Suite 210",
    notes: "Bring the ferritin lab printout and the period-flow log.",
    kind: "appointment",
  },
  {
    id: "gcal-mock-002",
    title: "Lab draw — repeat CBC + ferritin (fasting not required)",
    offsetDays: 6,
    time: "08:15",
    durationMin: 20,
    location: "Quest Diagnostics, Elm St",
    kind: "appointment",
  },
  {
    id: "gcal-mock-003",
    title: "Strength training with Nadia",
    offsetDays: 1,
    time: "18:00",
    durationMin: 45,
    location: "Community Gym",
    kind: "exercise",
  },
  {
    id: "gcal-mock-004",
    title: "Primary care annual physical — Dr. Alan Reyes",
    offsetDays: 21,
    time: "14:00",
    durationMin: 30,
    location: "Northside Family Medicine",
    kind: "appointment",
  },
  {
    id: "gcal-mock-005",
    title: "Therapy session (teletherapy)",
    offsetDays: 4,
    time: "17:00",
    durationMin: 50,
    location: "Video call",
    kind: "other",
  },
];

export const MOCK_DRIVE: MockDriveFile[] = [
  {
    id: "gdrive-mock-001",
    name: "CBC_and_Iron_Panel_results.pdf",
    mimeLabel: "PDF",
    sizeLabel: "212 KB",
    modifiedOffsetDays: -9,
    kind: "lab",
    text: `COMPLETE BLOOD COUNT WITH IRON STUDIES
Patient: female, 43 y
Hemoglobin 10.4 g/dL (ref 12.0-15.5) LOW
Hematocrit 32.1 % (ref 34.9-44.5) LOW
MCV 76 fL (ref 80-100) LOW
Platelets 298 K/uL (ref 150-400)
Ferritin 8 ng/mL (ref 15-150) LOW
Iron saturation 11 % (ref 20-50) LOW
TSH 2.1 mIU/L (ref 0.45-4.5)
Comment: Microcytic anemia consistent with iron deficiency. Correlate clinically with reported heavy menstrual bleeding.`,
  },
  {
    id: "gdrive-mock-002",
    name: "Visit_note_OBGYN_Patel.pdf",
    mimeLabel: "PDF",
    sizeLabel: "96 KB",
    modifiedOffsetDays: -9,
    kind: "note",
    text: `CLINIC NOTE — GYNECOLOGY
S: 43 y.o. G2P2 female w/ 7 mo h/o menorrhagia, cycles q21-24d, flooding x2-3d, fatigue, occasional palpitations on exertion. Denies syncope. FHx: mother w/ fibroids, father CAD age 50.
O: BP 128/84, HR 88. Abd soft, nontender. Pelvic exam: uterus mildly enlarged, mobile. TVUS: 2.6 cm intramural fibroid, endometrium 6 mm.
A: 1) Menorrhagia, likely leiomyoma + perimenopausal anovulatory cycles. 2) Iron deficiency anemia, Hgb 10.4, ferritin 8.
P: Start ferrous sulfate 325 mg PO QOD with vitamin C. Trial tranexamic acid 1300 mg TID PRN heavy days x5d/cycle. Repeat CBC/ferritin in 8 wks. Discuss LNG-IUS vs. endometrial ablation at follow-up. RTC 2 wks. Return sooner for soaking >1 pad/hr, dizziness, chest pain.`,
  },
  {
    id: "gdrive-mock-003",
    name: "Mammogram_report_2026.pdf",
    mimeLabel: "PDF",
    sizeLabel: "141 KB",
    modifiedOffsetDays: -34,
    kind: "lab",
    text: `SCREENING MAMMOGRAM, BILATERAL, WITH TOMOSYNTHESIS
Findings: Heterogeneously dense breast tissue (category C). No suspicious mass, architectural distortion, or malignant-type calcifications. Benign appearing calcifications right upper outer quadrant.
ASSESSMENT: BI-RADS 1 — Negative.
RECOMMENDATION: Routine screening mammography in 1 year. Dense tissue may lower mammographic sensitivity; discuss supplemental screening if additional risk factors.`,
  },
  {
    id: "gdrive-mock-004",
    name: "Pharmacy_printout_ferrous_sulfate.pdf",
    mimeLabel: "PDF",
    sizeLabel: "58 KB",
    modifiedOffsetDays: -8,
    kind: "prescription",
    text: `FERROUS SULFATE 325 MG (65 MG ELEMENTAL IRON) ORAL TABLET
Take 1 tablet by mouth every other day with a source of vitamin C. Do not take within 2 hours of calcium, antacids, coffee, or tea.
Common effects: dark stools, constipation, nausea, stomach upset.
Quantity 45, refills 2. Prescriber: M. Patel, MD.`,
  },
];

export const MOCK_GMAIL: MockGmailMessage[] = [
  {
    id: "gmail-mock-001",
    from: "Riverside Women's Health <noreply@riversidewh.example>",
    subject: "Appointment confirmed: Dr. Meera Patel, follow-up",
    receivedOffsetDays: -3,
    snippet: "Your visit is confirmed. Please arrive 15 minutes early with your insurance card…",
    body:
      "Your follow-up with Dr. Meera Patel is confirmed. Please arrive 15 minutes early with your insurance card. Bring a list of current medications and any home logs (bleeding days, symptoms).",
    detected: {
      title: "OB-GYN follow-up — Dr. Meera Patel",
      offsetDays: 2,
      time: "10:30",
      location: "Riverside Women's Health, Suite 210",
    },
  },
  {
    id: "gmail-mock-002",
    from: "Quest Diagnostics <results@quest.example>",
    subject: "Your lab results are ready",
    receivedOffsetDays: -9,
    snippet: "1 new result available: Complete Blood Count with iron studies…",
    body: "One new result is available in your portal: Complete Blood Count with iron studies, collected last week.",
    attachment: {
      name: "CBC_and_Iron_Panel_results.pdf",
      kind: "lab",
      text: MOCK_DRIVE[0].text,
    },
  },
  {
    id: "gmail-mock-003",
    from: "Northside Family Medicine <frontdesk@northside.example>",
    subject: "Time for your annual physical",
    receivedOffsetDays: -1,
    snippet: "We have openings with Dr. Alan Reyes this month…",
    body: "It has been a year since your last physical. We have openings with Dr. Alan Reyes this month.",
    detected: {
      title: "Primary care annual physical — Dr. Alan Reyes",
      offsetDays: 21,
      time: "14:00",
      location: "Northside Family Medicine",
    },
  },
  {
    id: "gmail-mock-004",
    from: "CVS Pharmacy <refills@cvs.example>",
    subject: "Refill ready: ferrous sulfate 325 mg",
    receivedOffsetDays: -2,
    snippet: "Your prescription is ready for pickup at Elm St…",
    body: "Your prescription for ferrous sulfate 325 mg is ready for pickup at the Elm St store. 2 refills remain.",
    attachment: {
      name: "Pharmacy_printout_ferrous_sulfate.pdf",
      kind: "prescription",
      text: MOCK_DRIVE[3].text,
    },
  },
];

// ===== Outlook / Apple calendar stubs (sample data, no real account) =====

export const MOCK_OUTLOOK_ACCOUNT = "awalin.example@outlook.com";
export const MOCK_APPLE_ACCOUNT = "awalin.example@icloud.com";

export const MOCK_OUTLOOK_CALENDAR: MockCalendarEvent[] = [
  {
    id: "outlook-mock-001",
    title: "Dermatology consult — Dr. Hannah Cole",
    offsetDays: 5,
    time: "11:15",
    durationMin: 30,
    location: "Lakeview Dermatology, 3rd floor",
    notes: "Photos of the forearm rash are in Documents.",
    kind: "appointment",
  },
  {
    id: "outlook-mock-002",
    title: "Benefits call — employer wellness program",
    offsetDays: 3,
    time: "13:00",
    durationMin: 25,
    location: "Teams meeting",
    kind: "other",
  },
  {
    id: "outlook-mock-003",
    title: "Lunchtime walk with the team",
    offsetDays: 1,
    time: "12:15",
    durationMin: 30,
    location: "Riverwalk",
    kind: "exercise",
  },
];

export const MOCK_APPLE_CALENDAR: MockCalendarEvent[] = [
  {
    id: "apple-mock-001",
    title: "Dentist cleaning — Dr. Lin",
    offsetDays: 9,
    time: "09:00",
    durationMin: 45,
    location: "Elm Street Dental",
    kind: "appointment",
  },
  {
    id: "apple-mock-002",
    title: "Yoga class",
    offsetDays: 2,
    time: "07:30",
    durationMin: 60,
    location: "Still Point Studio",
    kind: "exercise",
  },
  {
    id: "apple-mock-003",
    title: "Meditation — 10 minutes before bed",
    offsetDays: 0,
    time: "22:00",
    durationMin: 10,
    kind: "other",
  },
];

const CONN_KEY = "pj_mock_google_v1";

export type MockConnections = {
  calendar: boolean;
  drive: boolean;
  gmail: boolean;
  outlook: boolean;
  apple: boolean;
  driveFolder: string;
};

export function loadConnections(): MockConnections {
  try {
    const raw = JSON.parse(localStorage.getItem(CONN_KEY) ?? "{}");
    return {
      calendar: !!raw.calendar,
      drive: !!raw.drive,
      gmail: !!raw.gmail,
      outlook: !!raw.outlook,
      apple: !!raw.apple,
      driveFolder: typeof raw.driveFolder === "string" ? raw.driveFolder : "",
    };
  } catch {
    return { calendar: false, drive: false, gmail: false, outlook: false, apple: false, driveFolder: "" };
  }
}

export function saveConnections(c: MockConnections) {
  localStorage.setItem(CONN_KEY, JSON.stringify(c));
}
