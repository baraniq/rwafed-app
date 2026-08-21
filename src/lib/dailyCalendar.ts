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

function mapEntry(key: string, raw: any): DailyCalendarEntry | null {
  if (!raw || typeof raw !== "object") return null;
  return { date: key, ...raw } as DailyCalendarEntry;
}

/**
 * Subscribe to today's calendar entry in real time.
 * Matches by Gregorian date key (YYYY-MM-DD) which is the key
 * the channel publisher uses for each day's post.
 * Returns an unsubscribe function. When today's entry is not published
 * yet, the callback receives `null`.
 */
export function subscribeTodayCalendar(
  callback: (entry: DailyCalendarEntry | null) => void
): () => void {
  const todayRef = ref(db, `dailyCalendar/${todayKey()}`);
  const handler = (snapshot: DataSnapshot) => {
    const raw = snapshot.val();
    callback(raw && typeof raw === "object" ? mapEntry(todayKey(), raw) : null);
  };
  onValue(todayRef, handler);
  return () => off(todayRef, "value", handler);
}

/** One-time fetch of today's calendar entry (null if not published yet). */
export async function fetchTodayCalendar(): Promise<DailyCalendarEntry | null> {
  const snap = await get(ref(db, `dailyCalendar/${todayKey()}`));
  const raw = snap.val();
  return raw && typeof raw === "object" ? mapEntry(todayKey(), raw) : null;
}
