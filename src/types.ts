export interface QuranAyah {
  id: number;
  idSurah: number;
  ayahNumber: number;
  originalText: string;
  simpleMinimal: string;
  searchText1: string;
  searchText2: string;
  searchText3: string;
  pageNumber: number;
  hizbNumber: number;
  juzNumber: number;
}

export interface SurahMeta {
  id: number;
  name: string;
  englishName: string;
  ayahCount: number;
  type: "meccan" | "medinan";
}

export interface AyahTafseer {
  ayahId: number;
  tafseerName: string;
  text: string;
}

export interface KhatmaPart {
  id: string;
  khatmaId: string;
  partNumber: number;
  status: "available" | "reserved" | "completed";
  reservedBy?: string;
  completedAt?: string;
}

export interface Khatma {
  id: string;
  name: string;
  createdAt: string;
  parts: KhatmaPart[];
  totalParts: number;
  ownerFingerprint?: string;
  ownerName?: string;
}

export interface DuaRequest {
  id: string;
  name: string;
  duaText: string;
  category: string;
  timestamp: string;
  anonymous: boolean;
  deviceFingerprint: string;
  prayCount: number;
}

export interface IstikharaEntry {
  pageNumber: number;
  surahName: string;
  ayahNumber: number;
  ayahText: string;
  verdict: string;
  summary: string;
  advice: string;
}

export interface IstikharaHistoryItem {
  id: string;
  purpose: string;
  pageNumber: number;
  entry: IstikharaEntry;
  timestamp: string;
}

export interface DevotionItem {
  id: number;
  kind: "dua" | "ziyarat";
  title: string;
  arabicTitle: string;
  category: string;
  description: string;
  virtue?: string;
  timeRecommended: string;
  text: string[];
}

export type DevotionKind = "dua" | "ziyarat";

export interface QadaState {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  fasting: number;
}

export interface ReflectionChecklist {
  fajrOnTime: boolean;
  dhuhrAsrOnTime: boolean;
  maghribIshaOnTime: boolean;
  quranRead: boolean;
  tasbeehDone: boolean;
  charityOrHelp: boolean;
  tongueGuarded: boolean;
  parentsRespect: boolean;
  notes: string;
  date: string;
}
