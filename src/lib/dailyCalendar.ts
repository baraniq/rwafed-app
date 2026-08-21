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

/** Get today's Hijri date as a searchable key (e.g. "25 صفر المظفر 1448") */
export function hijriKey(d: Date = new Date()): string {
  try {
    const shifted = new Date(d);
    shifted.setDate(shifted.getDate() - 1);
    const formatter = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return formatter.format(shifted);
  } catch {
    return "";
  }
}

function mapEntry(key: string, raw: any): DailyCalendarEntry | null {
  if (!raw || typeof raw !== "object") return null;
  return { date: key, ...raw } as DailyCalendarEntry;
}

/**
 * Subscribe to today's calendar entry in real time.
 * Matches by Hijri date across all dailyCalendar entries.
 * Falls back to Gregorian key match if no Hijri match found.
 */
export function subscribeTodayCalendar(
  callback: (entry: DailyCalendarEntry | null) => void
): () => void {
  const calRef = ref(db, "dailyCalendar");
  const hk = hijriKey();
  const gk = todayKey();
  const handler = (snapshot: DataSnapshot) => {
    const all = snapshot.val();
    if (!all || typeof all !== "object") {
      callback(null);
      return;
    }
    let match: DailyCalendarEntry | null = null;
    for (const [key, raw] of Object.entries(all)) {
      const entry = mapEntry(key, raw);
      if (!entry) continue;
      if (entry.hijri && hk && entry.hijri.includes(hk.split(" ").slice(0, 2).join(" "))) {
        match = entry;
        break;
      }
    }
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
  const hk = hijriKey();
  const gk = todayKey();
  for (const [key, raw] of Object.entries(all)) {
    const entry = mapEntry(key, raw);
    if (!entry) continue;
    if (entry.hijri && hk && entry.hijri.includes(hk.split(" ").slice(0, 2).join(" "))) {
      return entry;
    }
  }
  const fallback = all[gk];
  return fallback && typeof fallback === "object" ? mapEntry(gk, fallback) : null;
}
