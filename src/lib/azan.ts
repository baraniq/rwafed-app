import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { calculatePrayerTimes } from "./prayerTimes";

export interface AzanSound {
  id: string;
  url: string;
  sound: string;
  label: string;
}

export const AZAN_SOUNDS: AzanSound[] = [
  { id: "azan_1", url: "audio/azan_1.mp3", sound: "azan_1", label: "الأذان الأول" },
  { id: "azan_2", url: "audio/azan_2.mp3", sound: "azan_2", label: "الأذان الثاني" },
  { id: "azan_3", url: "audio/azan_3.mp3", sound: "azan_3", label: "الأذان الثالث" },
  { id: "azan_4", url: "audio/azan_4.mp3", sound: "azan_4", label: "الأذان الرابع" },
];

export const AZAN_BASE_ID = 100000;

const SETTINGS_KEY = "naseem_azan_settings";
const SCHEDULED_KEY = "naseem_azan_scheduled_ids";

export interface AzanSettings {
  enabled: boolean;
  azanIndex: number;
}

const DEFAULT_SETTINGS: AzanSettings = { enabled: false, azanIndex: 0 };

export function getAzanSettings(): AzanSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: !!parsed.enabled,
        azanIndex: Number.isInteger(parsed.azanIndex) && parsed.azanIndex >= 0 && parsed.azanIndex < AZAN_SOUNDS.length ? parsed.azanIndex : 0,
      };
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveAzanSettings(settings: AzanSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function getScheduledIds(): number[] {
  try {
    const raw = localStorage.getItem(SCHEDULED_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

function saveScheduledIds(ids: number[]): void {
  localStorage.setItem(SCHEDULED_KEY, JSON.stringify(ids));
}

async function ensureAzanChannels(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    for (const s of AZAN_SOUNDS) {
      // @ts-ignore - createChannel is available on Android in v6
      if (!LocalNotifications.createChannel) continue;
      // @ts-ignore
      await LocalNotifications.createChannel({
        id: s.id,
        name: s.label,
        description: "منبه الأذان - " + s.label,
        importance: 5,
        vibration: true,
        sound: s.sound,
        visibility: 1,
      });
    }
  } catch (e) {
    console.error("azan channel creation error", e);
  }
}

export async function cancelAzanAlarms(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const ids = getScheduledIds();
  if (ids.length > 0) {
    try {
      await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
    } catch (e) {
      console.error("cancel azan error", e);
    }
    saveScheduledIds([]);
  }
}

export interface ScheduleResult {
  count: number;
  granted: boolean;
}

export async function scheduleAzanAlarms(
  lat: number,
  lng: number,
  tzOffset: number
): Promise<ScheduleResult | null> {
  if (!Capacitor.isNativePlatform()) return null;

  const settings = getAzanSettings();

  if (!settings.enabled) {
    await cancelAzanAlarms();
    return { count: 0, granted: true };
  }

  const perm = await LocalNotifications.requestPermissions();
  if (perm.display !== "granted") {
    return { count: 0, granted: false };
  }

  await ensureAzanChannels();
  await cancelAzanAlarms();

  const sound = AZAN_SOUNDS[settings.azanIndex];
  const now = new Date();
  const notifications: any[] = [];
  const ids: number[] = [];

  // Schedule the next 7 days so the alarm keeps working even if the app is not reopened.
  for (let day = 0; day < 7; day++) {
    const d = new Date(now);
    d.setDate(d.getDate() + day);
    const t = calculatePrayerTimes(d, lat, lng, tzOffset);
    const prayers: { name: string; time: Date }[] = [
      { name: "الفجر", time: t.fajr },
      { name: "الظهر", time: t.dhuhr },
      { name: "العصر", time: t.asr },
      { name: "المغرب", time: t.maghrib },
      { name: "العشاء", time: t.isha },
    ];
    for (const p of prayers) {
      if (p.time.getTime() <= now.getTime()) continue;
      const id = AZAN_BASE_ID + ids.length;
      ids.push(id);
      notifications.push({
        id,
        title: "حان وقت صلاة " + p.name,
        body: sound.label,
        schedule: {
          at: p.time,
          allowWhileIdle: true,
        },
        channelId: sound.id,
        sound: sound.sound,
        smallIcon: "ic_stat_icon",
      });
    }
  }

  if (notifications.length === 0) return { count: 0, granted: true };

  try {
    await LocalNotifications.schedule({ notifications });
    saveScheduledIds(ids);
    return { count: notifications.length, granted: true };
  } catch (e) {
    console.error("schedule azan error", e);
    return { count: 0, granted: true };
  }
}

let previewAudio: HTMLAudioElement | null = null;

export function playAzanPreview(sound: AzanSound): void {
  stopAzanPreview();
  try {
    const audio = new Audio(sound.url);
    audio.loop = false;
    audio.play().catch((e) => console.error("azan preview error", e));
    previewAudio = audio;
  } catch (e) {
    console.error("azan preview creation error", e);
  }
}

export function stopAzanPreview(): void {
  if (previewAudio) {
    try {
      previewAudio.pause();
      previewAudio.src = "";
    } catch {
      /* ignore */
    }
    previewAudio = null;
  }
}
