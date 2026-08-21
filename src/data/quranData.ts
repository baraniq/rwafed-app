// TODO: This file contains static surah metadata and placeholder ayah functions.
// Real ayah data will be loaded from quran-hadi-resources/exported-csv/ayah.csv in a future iteration.

export interface SurahMeta {
  id: number;
  name: string;
  englishName: string;
  ayahCount: number;
  type: "meccan" | "medinan";
}

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

export const surahs: SurahMeta[] = [
  { id: 1, name: "الفاتحة", englishName: "Al-Fatihah", ayahCount: 7, type: "meccan" },
  { id: 2, name: "البقرة", englishName: "Al-Baqarah", ayahCount: 286, type: "medinan" },
  { id: 3, name: "آل عمران", englishName: "Aal-E-Imran", ayahCount: 200, type: "medinan" },
  { id: 4, name: "النساء", englishName: "An-Nisa", ayahCount: 176, type: "medinan" },
  { id: 5, name: "المائدة", englishName: "Al-Maidah", ayahCount: 120, type: "medinan" },
  { id: 6, name: "الأنعام", englishName: "Al-Anam", ayahCount: 165, type: "meccan" },
  { id: 7, name: "الأعراف", englishName: "Al-Araf", ayahCount: 206, type: "meccan" },
  { id: 8, name: "الأنفال", englishName: "Al-Anfal", ayahCount: 75, type: "medinan" },
  { id: 9, name: "التوبة", englishName: "At-Tawbah", ayahCount: 129, type: "medinan" },
  { id: 10, name: "يونس", englishName: "Yunus", ayahCount: 109, type: "meccan" },
  { id: 11, name: "هود", englishName: "Hud", ayahCount: 123, type: "meccan" },
  { id: 12, name: "يوسف", englishName: "Yusuf", ayahCount: 111, type: "meccan" },
  { id: 13, name: "الرعد", englishName: "Ar-Rad", ayahCount: 43, type: "medinan" },
  { id: 14, name: "إبراهيم", englishName: "Ibrahim", ayahCount: 52, type: "meccan" },
  { id: 15, name: "الحجر", englishName: "Al-Hijr", ayahCount: 99, type: "meccan" },
  { id: 16, name: "النحل", englishName: "An-Nahl", ayahCount: 128, type: "meccan" },
  { id: 17, name: "الإسراء", englishName: "Al-Isra", ayahCount: 111, type: "meccan" },
  { id: 18, name: "الكهف", englishName: "Al-Kahf", ayahCount: 110, type: "meccan" },
  { id: 19, name: "مريم", englishName: "Maryam", ayahCount: 98, type: "meccan" },
  { id: 20, name: "طه", englishName: "Taha", ayahCount: 135, type: "meccan" },
  { id: 21, name: "الأنبياء", englishName: "Al-Anbiya", ayahCount: 112, type: "meccan" },
  { id: 22, name: "الحج", englishName: "Al-Hajj", ayahCount: 78, type: "medinan" },
  { id: 23, name: "المؤمنون", englishName: "Al-Muminun", ayahCount: 118, type: "meccan" },
  { id: 24, name: "النور", englishName: "An-Nur", ayahCount: 64, type: "medinan" },
  { id: 25, name: "الفرقان", englishName: "Al-Furqan", ayahCount: 77, type: "meccan" },
  { id: 26, name: "الشعراء", englishName: "Ash-Shuara", ayahCount: 227, type: "meccan" },
  { id: 27, name: "النمل", englishName: "An-Naml", ayahCount: 93, type: "meccan" },
  { id: 28, name: "القصص", englishName: "Al-Qasas", ayahCount: 88, type: "meccan" },
  { id: 29, name: "العنكبوت", englishName: "Al-Ankabut", ayahCount: 69, type: "meccan" },
  { id: 30, name: "الروم", englishName: "Ar-Rum", ayahCount: 60, type: "meccan" },
  { id: 31, name: "لقمان", englishName: "Luqman", ayahCount: 34, type: "meccan" },
  { id: 32, name: "السجدة", englishName: "As-Sajdah", ayahCount: 30, type: "meccan" },
  { id: 33, name: "الأحزاب", englishName: "Al-Ahzab", ayahCount: 73, type: "medinan" },
  { id: 34, name: "سبأ", englishName: "Saba", ayahCount: 54, type: "meccan" },
  { id: 35, name: "فاطر", englishName: "Fatir", ayahCount: 45, type: "meccan" },
  { id: 36, name: "يس", englishName: "Ya-Sin", ayahCount: 83, type: "meccan" },
  { id: 37, name: "الصافات", englishName: "As-Saffat", ayahCount: 182, type: "meccan" },
  { id: 38, name: "ص", englishName: "Sad", ayahCount: 88, type: "meccan" },
  { id: 39, name: "الزمر", englishName: "Az-Zumar", ayahCount: 75, type: "meccan" },
  { id: 40, name: "غافر", englishName: "Ghafir", ayahCount: 85, type: "meccan" },
  { id: 41, name: "فصلت", englishName: "Fussilat", ayahCount: 54, type: "meccan" },
  { id: 42, name: "الشورى", englishName: "Ash-Shura", ayahCount: 53, type: "meccan" },
  { id: 43, name: "الزخرف", englishName: "Az-Zukhruf", ayahCount: 89, type: "meccan" },
  { id: 44, name: "الدخان", englishName: "Ad-Dukhan", ayahCount: 59, type: "meccan" },
  { id: 45, name: "الجاثية", englishName: "Al-Jathiyah", ayahCount: 37, type: "meccan" },
  { id: 46, name: "الأحقاف", englishName: "Al-Ahqaf", ayahCount: 35, type: "meccan" },
  { id: 47, name: "محمد", englishName: "Muhammad", ayahCount: 38, type: "medinan" },
  { id: 48, name: "الفتح", englishName: "Al-Fath", ayahCount: 29, type: "medinan" },
  { id: 49, name: "الحجرات", englishName: "Al-Hujurat", ayahCount: 18, type: "medinan" },
  { id: 50, name: "ق", englishName: "Qaf", ayahCount: 45, type: "meccan" },
  { id: 51, name: "الذاريات", englishName: "Adh-Dhariyat", ayahCount: 60, type: "meccan" },
  { id: 52, name: "الطور", englishName: "At-Tur", ayahCount: 49, type: "meccan" },
  { id: 53, name: "النجم", englishName: "An-Najm", ayahCount: 62, type: "meccan" },
  { id: 54, name: "القمر", englishName: "Al-Qamar", ayahCount: 55, type: "meccan" },
  { id: 55, name: "الرحمن", englishName: "Ar-Rahman", ayahCount: 78, type: "medinan" },
  { id: 56, name: "الواقعة", englishName: "Al-Waqiah", ayahCount: 96, type: "meccan" },
  { id: 57, name: "الحديد", englishName: "Al-Hadid", ayahCount: 29, type: "medinan" },
  { id: 58, name: "المجادلة", englishName: "Al-Mujadilah", ayahCount: 22, type: "medinan" },
  { id: 59, name: "الحشر", englishName: "Al-Hashr", ayahCount: 24, type: "medinan" },
  { id: 60, name: "الممتحنة", englishName: "Al-Mumtahanah", ayahCount: 13, type: "medinan" },
  { id: 61, name: "الصف", englishName: "As-Saf", ayahCount: 14, type: "medinan" },
  { id: 62, name: "الجمعة", englishName: "Al-Jumuah", ayahCount: 11, type: "medinan" },
  { id: 63, name: "المنافقون", englishName: "Al-Munafiqun", ayahCount: 11, type: "medinan" },
  { id: 64, name: "التغابن", englishName: "At-Taghabun", ayahCount: 18, type: "medinan" },
  { id: 65, name: "الطلاق", englishName: "At-Talaq", ayahCount: 12, type: "medinan" },
  { id: 66, name: "التحريم", englishName: "At-Tahrim", ayahCount: 12, type: "medinan" },
  { id: 67, name: "الملك", englishName: "Al-Mulk", ayahCount: 30, type: "meccan" },
  { id: 68, name: "القلم", englishName: "Al-Qalam", ayahCount: 52, type: "meccan" },
  { id: 69, name: "الحاقة", englishName: "Al-Haqqah", ayahCount: 52, type: "meccan" },
  { id: 70, name: "المعارج", englishName: "Al-Maarij", ayahCount: 44, type: "meccan" },
  { id: 71, name: "نوح", englishName: "Nuh", ayahCount: 28, type: "meccan" },
  { id: 72, name: "الجن", englishName: "Al-Jinn", ayahCount: 28, type: "meccan" },
  { id: 73, name: "المزمل", englishName: "Al-Muzzammil", ayahCount: 20, type: "meccan" },
  { id: 74, name: "المدثر", englishName: "Al-Muddaththir", ayahCount: 56, type: "meccan" },
  { id: 75, name: "القيامة", englishName: "Al-Qiyamah", ayahCount: 40, type: "meccan" },
  { id: 76, name: "الإنسان", englishName: "Al-Insan", ayahCount: 31, type: "medinan" },
  { id: 77, name: "المرسلات", englishName: "Al-Mursalat", ayahCount: 50, type: "meccan" },
  { id: 78, name: "النبأ", englishName: "An-Naba", ayahCount: 40, type: "meccan" },
  { id: 79, name: "النازعات", englishName: "An-Naziat", ayahCount: 46, type: "meccan" },
  { id: 80, name: "عبس", englishName: "Abasa", ayahCount: 42, type: "meccan" },
  { id: 81, name: "التكوير", englishName: "At-Takwir", ayahCount: 29, type: "meccan" },
  { id: 82, name: "الانفطار", englishName: "Al-Infitar", ayahCount: 19, type: "meccan" },
  { id: 83, name: "المطففين", englishName: "Al-Mutaffifin", ayahCount: 36, type: "meccan" },
  { id: 84, name: "الانشقاق", englishName: "Al-Inshiqaq", ayahCount: 25, type: "meccan" },
  { id: 85, name: "البروج", englishName: "Al-Buruj", ayahCount: 22, type: "meccan" },
  { id: 86, name: "الطارق", englishName: "At-Tariq", ayahCount: 17, type: "meccan" },
  { id: 87, name: "الأعلى", englishName: "Al-Ala", ayahCount: 19, type: "meccan" },
  { id: 88, name: "الغاشية", englishName: "Al-Ghashiyah", ayahCount: 26, type: "meccan" },
  { id: 89, name: "الفجر", englishName: "Al-Fajr", ayahCount: 30, type: "meccan" },
  { id: 90, name: "البلد", englishName: "Al-Balad", ayahCount: 20, type: "meccan" },
  { id: 91, name: "الشمس", englishName: "Ash-Shams", ayahCount: 15, type: "meccan" },
  { id: 92, name: "الليل", englishName: "Al-Layl", ayahCount: 21, type: "meccan" },
  { id: 93, name: "الضحى", englishName: "Ad-Duha", ayahCount: 11, type: "meccan" },
  { id: 94, name: "الشرح", englishName: "Ash-Sharh", ayahCount: 8, type: "meccan" },
  { id: 95, name: "التين", englishName: "At-Tin", ayahCount: 8, type: "meccan" },
  { id: 96, name: "العلق", englishName: "Al-Alaq", ayahCount: 19, type: "meccan" },
  { id: 97, name: "القدر", englishName: "Al-Qadr", ayahCount: 5, type: "meccan" },
  { id: 98, name: "البينة", englishName: "Al-Bayyinah", ayahCount: 8, type: "medinan" },
  { id: 99, name: "الزلزلة", englishName: "Az-Zalzalah", ayahCount: 8, type: "medinan" },
  { id: 100, name: "العاديات", englishName: "Al-Adiyat", ayahCount: 11, type: "meccan" },
  { id: 101, name: "القارعة", englishName: "Al-Qariah", ayahCount: 11, type: "meccan" },
  { id: 102, name: "التكاثر", englishName: "At-Takathur", ayahCount: 8, type: "meccan" },
  { id: 103, name: "العصر", englishName: "Al-Asr", ayahCount: 3, type: "meccan" },
  { id: 104, name: "الهمزة", englishName: "Al-Humazah", ayahCount: 9, type: "meccan" },
  { id: 105, name: "الفيل", englishName: "Al-Fil", ayahCount: 5, type: "meccan" },
  { id: 106, name: "قريش", englishName: "Quraysh", ayahCount: 4, type: "meccan" },
  { id: 107, name: "الماعون", englishName: "Al-Maun", ayahCount: 7, type: "meccan" },
  { id: 108, name: "الكوثر", englishName: "Al-Kawthar", ayahCount: 3, type: "meccan" },
  { id: 109, name: "الكافرون", englishName: "Al-Kafirun", ayahCount: 6, type: "meccan" },
  { id: 110, name: "النصر", englishName: "An-Nasr", ayahCount: 3, type: "medinan" },
  { id: 111, name: "المسد", englishName: "Al-Masad", ayahCount: 5, type: "meccan" },
  { id: 112, name: "الإخلاص", englishName: "Al-Ikhlas", ayahCount: 4, type: "meccan" },
  { id: 113, name: "الفلق", englishName: "Al-Falaq", ayahCount: 5, type: "meccan" },
  { id: 114, name: "الناس", englishName: "An-Nas", ayahCount: 6, type: "meccan" },
];

// TODO: Replace placeholder functions with real data loaded from
// quran-hadi-resources/exported-csv/ayah.csv (6237 ayahs across 604 pages).
// Approaches to consider:
//   1. Build-time: Parse CSV → bundle as JSON import
//   2. Runtime: fetch('/data/ayah.csv') and parse on first call
//   3. Vite glob import: import.meta.glob for lazy loading

let ayahCache: QuranAyah[] | null = null;

export async function preLoadAllAyahs(): Promise<void> {
  if (ayahCache) return;
  await loadAyahs();
}

async function loadAyahs(): Promise<QuranAyah[]> {
  if (ayahCache) return ayahCache;

  try {
    const response = await fetch("/data/quran_ayats.json");
    const data = await response.json();
    ayahCache = (Array.isArray(data) ? data : []).map((a: any) => ({
      id: a.id,
      idSurah: a.idSurah,
      ayahNumber: a.ayahNumber,
      originalText: a.originalText,
      simpleMinimal: a.simpleMinimal || a.originalText,
      searchText1: a.searchText1 || "",
      searchText2: a.searchText2 || "",
      searchText3: a.searchText3 || "",
      pageNumber: a.pageNumber,
      hizbNumber: a.hizbNumber,
      juzNumber: a.juzNumber,
    }));
    return ayahCache!;
  } catch (err) {
    console.error("Failed to load ayah data:", err);
    return [];
  }
}

export async function getAyahsByPage(pageNumber: number): Promise<QuranAyah[]> {
  const ayahs = await loadAyahs();
  return ayahs.filter((a) => a.pageNumber === pageNumber);
}

export async function getAyahById(id: number): Promise<QuranAyah | undefined> {
  const ayahs = await loadAyahs();
  return ayahs.find((a) => a.id === id);
}

export async function getAyahsBySurah(idSurah: number): Promise<QuranAyah[]> {
  const ayahs = await loadAyahs();
  return ayahs.filter((a) => a.idSurah === idSurah);
}

export function getSurahById(id: number): SurahMeta | undefined {
  return surahs.find((s) => s.id === id);
}

export const TOTAL_PAGES = 604;
export const TOTAL_JUZ = 30;
export const TOTAL_HIZB = 60;

// Search through all ayahs (matches against searchText1/2/3 - no diacritics)
export async function searchAyahs(query: string): Promise<QuranAyah[]> {
  const ayahs = await loadAyahs();
  if (!query.trim()) return [];
  const q = query.trim();
  return ayahs.filter((a) => {
    const s1 = a.searchText1 || "";
    const s2 = a.searchText2 || "";
    const s3 = a.searchText3 || "";
    const simple = a.simpleMinimal || "";
    const orig = a.originalText || "";
    return s1.includes(q) || s2.includes(q) || s3.includes(q) || simple.includes(q) || orig.includes(q);
  });
}

// Returns the mushaf page number where the given surah starts (first ayah's page).
export async function getSurahStartPage(idSurah: number): Promise<number> {
  const ayahs = await loadAyahs();
  const first = ayahs.find((a) => a.idSurah === idSurah);
  return first ? first.pageNumber : 1;
}
