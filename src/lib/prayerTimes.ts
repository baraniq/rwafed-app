export interface PrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export interface NextPrayer {
  name: string;
  time: Date;
  remainingMs: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const JAFARI = { fajr: 16, maghrib: 4, isha: 14, asrShadowFactor: 1 };

const DEG = Math.PI / 180;
const sin = (d: number) => Math.sin(d * DEG);
const cos = (d: number) => Math.cos(d * DEG);
const tan = (d: number) => Math.tan(d * DEG);
const asin = (x: number) => Math.asin(x) / DEG;
const acos = (x: number) => Math.acos(x) / DEG;
const atan = (x: number) => Math.atan(x) / DEG;
const atan2 = (y: number, x: number) => Math.atan2(y, x) / DEG;

function fixAngle(a: number): number {
  a = a - 360 * Math.floor(a / 360);
  return a < 0 ? a + 360 : a;
}

function fixHour(h: number): number {
  h = h - 24 * Math.floor(h / 24);
  return h < 0 ? h + 24 : h;
}

function sunPosition(jd: number): { declination: number; equation: number } {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * sin(g) + 0.02 * sin(2 * g));
  const e = 23.439 - 0.00000036 * D;
  const RA = fixAngle(atan2(cos(e) * sin(L), cos(L))) / 15;
  const equation = q / 15 - fixHour(RA);
  const declination = asin(sin(e) * sin(L));
  return { declination, equation };
}

function julianDate(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    B -
    1524.5
  );
}

function hourAngle(angle: number, lat: number, decl: number): number {
  const cosH = (sin(angle) - sin(lat) * sin(decl)) / (cos(lat) * cos(decl));
  if (cosH > 1 || cosH < -1) return NaN;
  return acos(cosH) / 15;
}

function asrHour(lat: number, decl: number, shadowFactor: number): number {
  const altitude = atan(1 / (shadowFactor + tan(Math.abs(lat - decl))));
  return hourAngle(altitude, lat, decl);
}

export function calculatePrayerTimes(
  date: Date,
  lat: number,
  lng: number,
  tzOffset: number
): PrayerTimes {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const jd = julianDate(year, month, day);
  const { declination, equation } = sunPosition(jd);

  const noon = 12 + tzOffset - lng / 15 - equation;

  const fajrH = hourAngle(-JAFARI.fajr, lat, declination);
  const sunriseH = hourAngle(-0.833, lat, declination);
  const asrH = asrHour(lat, declination, JAFARI.asrShadowFactor);
  const maghribH = hourAngle(-JAFARI.maghrib, lat, declination);
  const ishaH = hourAngle(-JAFARI.isha, lat, declination);

  const makeTime = (hours: number): Date => {
    let h = hours;
    let dayOffset = 0;
    if (h >= 24) {
      dayOffset = 1;
      h -= 24;
    }
    if (h < 0) {
      dayOffset = -1;
      h += 24;
    }
    const result = new Date(date);
    result.setDate(result.getDate() + dayOffset);
    const hh = Math.floor(h);
    const mm = Math.floor((h - hh) * 60);
    result.setHours(hh, mm, 0, 0);
    return result;
  };

  return {
    fajr: makeTime(noon - fajrH),
    sunrise: makeTime(noon - sunriseH),
    dhuhr: makeTime(noon),
    asr: makeTime(noon + asrH),
    maghrib: makeTime(noon + maghribH),
    isha: makeTime(noon + ishaH),
  };
}

export function getNextPrayerInfo(
  lat: number,
  lng: number,
  tzOffset: number,
  now: Date
): { next: NextPrayer | null; today: PrayerTimes } {
  const today = calculatePrayerTimes(now, lat, lng, tzOffset);
  const entries: { name: string; time: Date }[] = [
    { name: "الفجر", time: today.fajr },
    { name: "الشروق", time: today.sunrise },
    { name: "الظهر", time: today.dhuhr },
    { name: "العصر", time: today.asr },
    { name: "المغرب", time: today.maghrib },
    { name: "العشاء", time: today.isha },
  ];

  for (const entry of entries) {
    if (entry.time.getTime() > now.getTime()) {
      return { next: { name: entry.name, time: entry.time, remainingMs: entry.time.getTime() - now.getTime() }, today };
    }
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowTimes = calculatePrayerTimes(tomorrow, lat, lng, tzOffset);
  return {
    next: { name: "الفجر", time: tomorrowTimes.fajr, remainingMs: tomorrowTimes.fajr.getTime() - now.getTime() },
    today,
  };
}

// Next prayer countdown limited to the three shown prayers: Fajr, Dhuhr, Maghrib
export function getNextPrayerAmongThree(
  lat: number,
  lng: number,
  tzOffset: number,
  now: Date
): { next: NextPrayer | null; today: PrayerTimes } {
  const today = calculatePrayerTimes(now, lat, lng, tzOffset);
  const entries: { name: string; time: Date }[] = [
    { name: "الفجر", time: today.fajr },
    { name: "الظهر", time: today.dhuhr },
    { name: "المغرب", time: today.maghrib },
  ];

  for (const entry of entries) {
    if (entry.time.getTime() > now.getTime()) {
      return { next: { name: entry.name, time: entry.time, remainingMs: entry.time.getTime() - now.getTime() }, today };
    }
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowTimes = calculatePrayerTimes(tomorrow, lat, lng, tzOffset);
  return {
    next: { name: "الفجر", time: tomorrowTimes.fajr, remainingMs: tomorrowTimes.fajr.getTime() - now.getTime() },
    today,
  };
}

export function getHijriDate(date: Date): string {
  // The Islamic day begins at sunset. The Intl formatter computes the day from
  // civil midnight, which can shift it one day ahead relative to the common
  // (e.g. Sistani) reckoning. We subtract one day to align with that reckoning.
  try {
    const shifted = new Date(date);
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

export function getGregorianDate(date: Date): string {
  try {
    const formatter = new Intl.DateTimeFormat("ar-EG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return formatter.format(date);
  } catch {
    return date.toLocaleDateString("ar");
  }
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function formatTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  let hours = date.getHours();
  const suffix = hours >= 12 ? "م" : "ص";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${pad(hours)}:${pad(date.getMinutes())} ${suffix}`;
}

const DEFAULT_COORDS: Coordinates = { latitude: 33.3128, longitude: 44.3615 };
const COORDS_KEY = "naseem_coords";

export function getCachedCoords(): Coordinates | null {
  try {
    const raw = localStorage.getItem(COORDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return null;
}

export function cacheCoords(coords: Coordinates): void {
  try {
    localStorage.setItem(COORDS_KEY, JSON.stringify(coords));
  } catch {
    /* ignore */
  }
}

export async function getCoordinates(): Promise<Coordinates> {
  const cached = getCachedCoords();
  if (cached) return cached;

  if (typeof navigator !== "undefined" && "geolocation" in navigator) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 8000,
          maximumAge: 60 * 60 * 1000,
        });
      });
      const coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      cacheCoords(coords);
      return coords;
    } catch {
      /* fall through to default */
    }
  }

  cacheCoords(DEFAULT_COORDS);
  return DEFAULT_COORDS;
}