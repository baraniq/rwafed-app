import { DevotionItem } from "../types";

export interface SahifaDua {
  id: number;
  number: number;
  title: string;
  text: string;
}

export interface SahifaData {
  title: string;
  subtitle: string;
  intro: string;
  count: number;
  duas: SahifaDua[];
}

export interface RisalahBook {
  id: string;
  title: string;
  authorId: number;
  sections: { title: string; body: string }[];
}

export interface RisalahAuthor {
  authorId: number;
  authorName: string;
  books: { id: string; title: string; sectionsCount: number }[];
}

export interface SafinaDuaItem {
  id: string;
  category: string;
  safinaCategory: string;
  titleAr: string;
  virtueAr: string;
  recommendedTimeAr: string;
  paragraphs: { arabic: string; english: string; persian: string }[];
}

const fallbackDevotions: DevotionItem[] = [
  {
    id: 1, kind: "dua", title: "Du'a Kumayl", arabicTitle: "دعاء كميل",
    category: "أدعية ليلية", description: "من أعظم الأدعية المأثورة عن الإمام علي (ع)، تُقرأ ليلة الجمعة.",
    virtue: "قراءة دعاء كميل ليلة الجمعة تُكفّر الذنوب وتقرب العبد من الله.",
    timeRecommended: "ليلة الجمعة بعد صلاة العشاء",
    text: ["اللَّهُمَّ إِنِّي أَسْأَلُكَ بِرَحْمَتِكَ الَّتِي وَسِعَتْ كُلَّ شَيْءٍ", "اللَّهُمَّ إِنِّي أَسْأَلُكَ بِعِزَّتِكَ الَّتِي لا يُضَامُ مَنْ عَاذَ بِهَا", "اللَّهُمَّ إِنِّي أَسْأَلُكَ بِجَلَالِكَ الَّتِي مَلَأَتْ أَرْكَانَ عَرْشِكَ", "اللَّهُمَّ إِنِّي أَسْأَلُكَ بِقُدْرَتِكَ الَّتِي قَهَرْتَ بِهَا كُلَّ شَيْءٍ", "اللَّهُمَّ لا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ وَلا أَقَلَّ مِنْ ذَلِكَ"],
  },
  {
    id: 2, kind: "dua", title: "Du'a Al-Hutba", arabicTitle: "دعاء الحُتبة",
    category: "أدعية الصباح", description: "دعاء مبارك يُقرأ صباح يوم الجمعة.",
    virtue: "تُحطّ الذنوب كأنها تُحطّ عنك الجبال.",
    timeRecommended: "صباح يوم الجمعة",
    text: ["اللَّهُمَّ إِنِّي أَسْأَلُكَ بِالْحَقِّ الَّذِي لَكَ عَلَى خَلْقِكَ", "وَبِالْحَقِّ الَّذِي لِخَلْقِكَ عَلَيْكَ", "أَنْ تُصَلِّيَ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ"],
  },
  {
    id: 3, kind: "dua", title: "Du'a Sabah", arabicTitle: "دعاء الصباح",
    category: "أدعية الصباح", description: "من أدعية الإمام علي (ع) المأثورة التي تُقال كل صباح.",
    virtue: "مَنْ قَرَأَهَا كَانَ فِي ذِمَّةِ اللهِ وَذِمَّةِ رَسُولِهِ.",
    timeRecommended: "كل صباح",
    text: ["اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا", "وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ", "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ"],
  },
  {
    id: 4, kind: "ziyarat", title: "Ziyarat Ashura", arabicTitle: "زيارة عاشوراء",
    category: "زيارة الإمام الحسين (ع)", description: "زيارة الإمام الحسين (ع) في يوم عاشوراء، من أعظم الزيارات المأثورة.",
    virtue: "مَنْ زَارَ الْحُسَيْنَ كَمَنْ زَارَ اللهَ فَوْقَ عَرْشِهِ.",
    timeRecommended: "يوم عاشوراء (10 محرم)",
    text: ["السَّلامُ عَلَيْكَ يَا أَبَا عَبْدِ اللهِ", "السَّلامُ عَلَيْكَ يَا ابْنَ رَسُولِ اللهِ", "السَّلامُ عَلَيْكَ يَا ابْنَ أَمِيرِ الْمُؤْمِنِينَ", "السَّلامُ عَلَيْكَ يَا ابْنَ فَاطِمَةَ الزَّهْرَاءِ"],
  },
  {
    id: 5, kind: "ziyarat", title: "Ziyarat Warith", arabicTitle: "زيارة وارث",
    category: "زيارة الإمام الحسين (ع)", description: "الزيارة المباركة التي تُقرأ في زيارته (ع) وهي من الزيارات الجامعة.",
    virtue: "زائِرُ الْحُسَيْنِ مِنِّي وَأَنَا مِنْهُ.",
    timeRecommended: "زيارة الإمام الحسين (ع) في كربلاء أو عبر الإنترنت",
    text: ["السَّلامُ عَلَى الْوَارِثِ", "السَّلامُ عَلَى الْمَظْلُومِ الشَّهِيدِ", "السَّلامُ عَلَى الْمَذْبُوحِ بِكَرْبَلَاءَ", "اللَّهُمَّ اجْعَلْنِي مِنْ أَصْحَابِ الْوِرَاثِ"],
  },
  {
    id: 6, kind: "ziyarat", title: "Ziyarat Arbaeen", arabicTitle: "زيارة الأربعين",
    category: "زيارة الإمام الحسين (ع)", description: "زيارة الأربعين لسيد الشهداء (ع)، تُقال في أربعينية الإمام الحسين.",
    virtue: "شِيعَتُنَا مِنَّا وَنَحْنُ مِنْهُمْ.",
    timeRecommended: "يوم الأربعين من استشهاد الإمام الحسين (ع)",
    text: ["السَّلامُ عَلَيْكَ يَا وَلِيَّ اللهِ وَابْنَ وَلِيِّهِ", "السَّلامُ عَلَيْكَ يَا ابْنَ فَاطِمَةَ الزَّهْرَاءِ سَيِّدَةِ نِسَاءِ الْعَالَمِينَ", "السَّلامُ عَلَى الْحُسَيْنِ الْمَقْتُولِ بِأَرْضِ كَرْبَلَاءَ"],
  },
  {
    id: 7, kind: "dua", title: "Du'a Tawassul", arabicTitle: "دعاء التوسّل",
    category: "أدعية متفرقة", description: "دعاء التوسّل بالأئمة المعصومين (عليهم السلام)، من الأدعية المهمة.",
    virtue: "من سأل الله بهذا الدعاء استجاب الله له.",
    timeRecommended: "أي وقت",
    text: ["اللَّهُمَّ إِنِّي أَتَوَسَّلُ بِكَ إِلَيْكَ", "وَأَسْأَلُكَ بِالْحُسَيْنِ بْنِ عَلِيٍّ", "أَنْ تَغْفِرَ لَنَا وَتَرْحَمَنَا"],
  },
  {
    id: 8, kind: "ziyarat", title: "Ziyarat Imam Ridha (AS)", arabicTitle: "زيارة الإمام الرضا (ع)",
    category: "زيارة الإمام الرضا (ع)", description: "زيارة الإمام علي بن موسى الرضا (ع) في مشهد المقدسة.",
    virtue: "مَنْ زَارَهُ عَارِفاً بِحَقِّهِ أَدْخَلَهُ اللهُ الْجَنَّةَ.",
    timeRecommended: "زيارة مشهد المقدسة",
    text: ["السَّلامُ عَلَيْكَ يَا أَبَا الْحَسَنِ", "السَّلامُ عَلَيْكَ يَا ابْنَ رَسُولِ اللهِ", "السَّلامُ عَلَيْكَ يَا أَخَا الْحُسَيْنِ"],
  },
];

let cachedDuas: DevotionItem[] | null = null;
let cachedSafinaDuas: SafinaDuaItem[] | null = null;
let cachedSahifa: SahifaData | null = null;
let cachedSafinaSahifa: SahifaData | null = null;
let cachedHadithKisa: { title: string; source: string; text: string } | null = null;
let cachedRisalahIndex: RisalahAuthor[] = [];

const safinaCategoryCache = new Map<string, SafinaDuaItem[]>();

export async function loadSafinaCategory(cat: string): Promise<SafinaDuaItem[]> {
  const cached = safinaCategoryCache.get(cat);
  if (cached) return cached;
  try {
    const res = await fetch(`/data/duas/safina_${cat}.json`);
    const items: SafinaDuaItem[] = await res.json();
    safinaCategoryCache.set(cat, items);
    return items;
  } catch {
    return [];
  }
}

export async function loadSafinaDuas(): Promise<SafinaDuaItem[]> {
  if (cachedSafinaDuas) return cachedSafinaDuas;
  try {
    const res = await fetch("/data/duas/safina_index.json");
    const index: { id: string; titleAr: string; category: string }[] = await res.json();
    cachedSafinaDuas = index.map(i => ({
      id: i.id,
      titleAr: i.titleAr,
      category: i.category,
      safinaCategory: i.category,
      virtueAr: "",
      recommendedTimeAr: "",
      paragraphs: [],
    }));
    return cachedSafinaDuas!;
  } catch {
    return [];
  }
}

export async function loadDuasFromServer(): Promise<DevotionItem[]> {
  if (cachedDuas) return cachedDuas;
  try {
    const res = await fetch("/data/duas/duas.json");
    const raw: any[] = await res.json();
    cachedDuas = raw.map((d, i) => ({
      id: i + 1000,
      kind: "dua" as const,
      title: d.titleAr || d.id,
      arabicTitle: d.titleAr || d.id,
      category: mapDuaCategory(d.category),
      description: d.virtueAr || "",
      virtue: d.virtueAr || "",
      timeRecommended: d.recommendedTimeAr || "",
      text: (d.paragraphs || []).map((p: any) => p.arabic || "").filter(Boolean),
    }));
    return cachedDuas!;
  } catch {
    return fallbackDevotions;
  }
}

export function mapSafinaToDevotionItem(item: SafinaDuaItem, index: number): DevotionItem {
  const kind = item.safinaCategory === "zeara" ? "ziyarat" : "dua";
  return {
    id: 5000 + index,
    kind,
    title: item.titleAr,
    arabicTitle: item.titleAr,
    category: item.category,
    description: "",
    virtue: item.virtueAr || "",
    timeRecommended: item.recommendedTimeAr || "",
    text: item.paragraphs.map(p => p.arabic).filter(Boolean),
  };
}

function mapDuaCategory(cat: string): string {
  const map: Record<string, string> = {
    daily: "أدعية يومية",
    weekly: "أدعية أسبوعية",
    ziyarat: "زيارات مأثورة",
    munajat: "مناجاة",
    sajjadiyya: "الصحيفة السجادية",
    travel: "أدعية السفر",
    food: "أدعية الطعام",
    istikhara: "الاستخارة",
    hajj: "الحج والعمرة",
    dua: "أدعية مأثورة",
  };
  return map[cat] || cat || "أدعية متنوعة";
}

export async function loadSahifaData(): Promise<SahifaData | null> {
  if (cachedSahifa) return cachedSahifa;
  try {
    const res = await fetch("/data/sahifa/sahifa.json");
    cachedSahifa = await res.json();
    return cachedSahifa;
  } catch {
    return null;
  }
}

export async function loadSafinaSahifaData(): Promise<SahifaData | null> {
  if (cachedSafinaSahifa) return cachedSafinaSahifa;
  try {
    const res = await fetch("/data/sahifa/safina_sahifa.json");
    cachedSafinaSahifa = await res.json();
    return cachedSafinaSahifa;
  } catch {
    return null;
  }
}

export async function loadHadithKisa(): Promise<{ title: string; source: string; text: string } | null> {
  if (cachedHadithKisa) return cachedHadithKisa;
  try {
    const res = await fetch("/data/duas/hadith_kisa.json");
    cachedHadithKisa = await res.json();
    return cachedHadithKisa;
  } catch {
    return null;
  }
}

export async function loadRisalahIndex(): Promise<RisalahAuthor[]> {
  if (cachedRisalahIndex.length) return cachedRisalahIndex;
  try {
    const res = await fetch("/data/risalah/index.json");
    const data = await res.json();
    cachedRisalahIndex = data.authors || [];
    return cachedRisalahIndex;
  } catch {
    return [];
  }
}

export async function loadRisalahBook(bookId: string): Promise<RisalahBook | null> {
  try {
    const res = await fetch(`/data/risalah/${bookId}.json`);
    return await res.json();
  } catch {
    return null;
  }
}

export { fallbackDevotions as devotionsList };
