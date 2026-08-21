const STORAGE_PREFIX = "rwafed_settings_";

export interface AppSettings {
  darkMode: boolean;
  hapticEnabled: boolean;
  notificationsEnabled: boolean;
  prayerNotifications: boolean;
  communityNotifications: boolean;
  fontSize: number;
}

const defaults: AppSettings = {
  darkMode: false,
  hapticEnabled: true,
  notificationsEnabled: true,
  prayerNotifications: true,
  communityNotifications: true,
  fontSize: 16,
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch { /* ok */ }
}

export function getSettings(): AppSettings {
  return {
    darkMode: load("darkMode", defaults.darkMode),
    hapticEnabled: load("hapticEnabled", defaults.hapticEnabled),
    notificationsEnabled: load("notificationsEnabled", defaults.notificationsEnabled),
    prayerNotifications: load("prayerNotifications", defaults.prayerNotifications),
    communityNotifications: load("communityNotifications", defaults.communityNotifications),
    fontSize: load("fontSize", defaults.fontSize),
  };
}

export function setDarkMode(v: boolean) { save("darkMode", v); }
export function setHapticEnabled(v: boolean) { save("hapticEnabled", v); }
export function setNotificationsEnabled(v: boolean) { save("notificationsEnabled", v); }
export function setPrayerNotifications(v: boolean) { save("prayerNotifications", v); }
export function setCommunityNotifications(v: boolean) { save("communityNotifications", v); }
export function setFontSize(v: number) { save("fontSize", v); }
