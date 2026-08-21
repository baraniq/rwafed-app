import { db } from "./firebase";
import {
  ref,
  onValue,
  off,
  get,
  DataSnapshot,
} from "firebase/database";

export interface DailyCalendarEntry {
  date: string;
  weekday: string;
  gregorian: string;
  hijri: string;
  events: string;
  warning?: string;
  nufahat: string;
  fadael: string;
  hikma: string;
  sira: string;
  ziyara: string;
  dua: string;
  taweezh: string;
  dhikr: string;
  istighfar: string;
  adhkar: string;
  wird: string;
  sadaqa: string;
  fiqh: string;
  travel: string;
  marital: string;
  clothes: string;
  hair: string;
  nails: string;
}

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Get today's Hijri date from the phone (sunset-based: -1 day) */
export function getPhoneHijri(d: Date = new Date()): string {
  try {
    const shifted = new Date(d);
    shifted.setDate(shifted.getDate() - 1);
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(shifted);
  } catch {
    return "";
  }
}

/** Extract just the day number (Arabic-Indic digits) from a hijri string */
function extractDay(hijri: string): string {
  const m = hijri.match(/[\u0660-\u0669]+/);
  return m ? m[0] : "";
}

/** Extract month name (first Arabic word that is not a number) from a hijri string */
function extractMonth(hijri: string): string {
  const cleaned = hijri.replace(/[\/\u002F]/g, " ").replace(/\d+/g, " ").replace(/هـ/g, "").trim();
  const words = cleaned.split(/\s+/).filter((w) => w.length > 1);
  return words[0] || "";
}

function mapEntry(key: string, raw: any): DailyCalendarEntry | null {
  if (!raw || typeof raw !== "object") return null;
  return { date: key, ...raw } as DailyCalendarEntry;
}

/**
 * Search all dailyCalendar entries for one matching today's phone Hijri date.
 * Matches by comparing the day number + month name from the phone's Intl output
 * against the hijri field in each Firebase entry.
 */
export function subscribeTodayCalendar(
  callback: (entry: DailyCalendarEntry | null) => void
): () => void {
  const calRef = ref(db, "dailyCalendar");
  const phoneHijri = getPhoneHijri();
  const phoneDay = extractDay(phoneHijri);
  const phoneMonth = extractMonth(phoneHijri);
  const gk = todayKey();

  const handler = (snapshot: DataSnapshot) => {
    const all = snapshot.val();
    if (!all || typeof all !== "object") {
      callback(null);
      return;
    }

    // 1st: Try matching by phone Hijri date across all entries
    let match: DailyCalendarEntry | null = null;
    if (phoneDay && phoneMonth) {
      for (const [key, raw] of Object.entries(all)) {
        const entry = mapEntry(key, raw);
        if (!entry || !entry.hijri) continue;
        const entryDay = extractDay(entry.hijri);
        const entryMonth = extractMonth(entry.hijri);
        if (entryDay === phoneDay && entryMonth === phoneMonth) {
          match = entry;
          break;
        }
      }
    }

    // 2nd: Fallback to Gregorian key match
    if (!match) {
      const fallback = all[gk];
      if (fallback && typeof fallback === "object") {
        match = mapEntry(gk, fallback);
      }
    }

    callback(match);
  };
  onValue(calRef, handler);
  return () => off(calRef, "value", handler);
}

/** One-time fetch of today's calendar entry (null if not published yet). */
export async function fetchTodayCalendar(): Promise<DailyCalendarEntry | null> {
  const snap = await get(ref(db, "dailyCalendar"));
  const all = snap.val();
  if (!all || typeof all !== "object") return null;

  const phoneHijri = getPhoneHijri();
  const phoneDay = extractDay(phoneHijri);
  const phoneMonth = extractMonth(phoneHijri);
  const gk = todayKey();

  if (phoneDay && phoneMonth) {
    for (const [key, raw] of Object.entries(all)) {
      const entry = mapEntry(key, raw);
      if (!entry || !entry.hijri) continue;
      const entryDay = extractDay(entry.hijri);
      const entryMonth = extractMonth(entry.hijri);
      if (entryDay === phoneDay && entryMonth === phoneMonth) {
        return entry;
      }
    }
  }

  const fallback = all[gk];
  return fallback && typeof fallback === "object" ? mapEntry(gk, fallback) : null;
}
