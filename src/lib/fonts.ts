export interface FontOption {
  id: string;
  name: string;
  family: string;
  style: "sans" | "serif" | "quran";
}

export const FONTS: FontOption[] = [
  { id: "tajawal", name: "Tajawal (الافتراضي)", family: "Tajawal, sans-serif", style: "sans" },
  { id: "nassim", name: "Nassim Arabic", family: "NassimArabic, sans-serif", style: "sans" },
  { id: "uthman", name: "Uthman TN", family: "Uthman TN, serif", style: "serif" },
  { id: "uthmanic", name: "Uthmanic Script", family: "UthmanicScript, serif", style: "serif" },
  { id: "sa_uthman", name: "SA Uthman TN", family: "SA Uthman TN, serif", style: "serif" },
  { id: "amiri", name: "Amiri", family: "Amiri, serif", style: "serif" },
  { id: "noto_naskh", name: "Noto Naskh Arabic", family: "Noto Naskh Arabic, serif", style: "serif" },
];

const STORAGE_KEY = "rwafed_font";

export function getSelectedFont(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || "tajawal";
  } catch {
    return "tajawal";
  }
}

export function setSelectedFont(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch { /* ok */ }
}

export function getFontById(id: string): FontOption {
  return FONTS.find((f) => f.id === id) || FONTS[0];
}
