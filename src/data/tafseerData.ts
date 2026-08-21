export interface TafseerSource {
  id: string;
  name: string;
  description: string;
}

export const tafseerSources: TafseerSource[] = [
  { id: "mizan", name: "الميزان", description: "تفسير الميزان للطباطبائي - تحليل أصولي معمّق" },
  { id: "amthal", name: "الأمثال", description: "تفسير الأمثال - تحليل بلاغي بالتمثيل القرآني" },
  { id: "noor", name: "النور", description: "تفسير النور - شرح إرشادي مبسط" },
];

interface TafsirData {
  count: number;
  texts: string[];
}

interface IndexMap {
  [key: string]: number;
}

let mizanData: TafsirData | null = null;
let amthalData: TafsirData | null = null;
let noorData: TafsirData | null = null;
let amthalIndex: IndexMap | null = null;
let noorIndex: IndexMap | null = null;

async function loadJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return res.json();
}

async function loadMizan(): Promise<TafsirData> {
  if (!mizanData) mizanData = await loadJson<TafsirData>("/data/tafsir/mizan.json");
  return mizanData;
}

async function loadAmthal(): Promise<TafsirData> {
  if (!amthalData) amthalData = await loadJson<TafsirData>("/data/tafsir/amthal.json");
  return amthalData;
}

async function loadNoor(): Promise<TafsirData> {
  if (!noorData) noorData = await loadJson<TafsirData>("/data/tafsir/noor.json");
  return noorData;
}

async function loadAmthalIndex(): Promise<IndexMap> {
  if (!amthalIndex) amthalIndex = await loadJson<IndexMap>("/data/tafsir/amthal_index.json");
  return amthalIndex;
}

async function loadNoorIndex(): Promise<IndexMap> {
  if (!noorIndex) noorIndex = await loadJson<IndexMap>("/data/tafsir/noor_index.json");
  return noorIndex;
}

export async function getPageTafseer(pageNumber: number, sourceId: string): Promise<string> {
  try {
    if (sourceId === "mizan") {
      const data = await loadMizan();
      const idx = pageNumber - 1;
      if (idx >= 0 && idx < data.texts.length) {
        return data.texts[idx].replace(/\r\n/g, "\n").trim();
      }
      return "تفسير الميزان غير متوفر لهذه الصفحة.";
    }

    if (sourceId === "amthal") {
      const data = await loadAmthal();
      const idx = pageNumber - 1;
      if (idx >= 0 && idx < data.texts.length) {
        return data.texts[idx].replace(/\r\n/g, "\n").trim();
      }
      return "تفسير الأمثال غير متوفر لهذه الصفحة.";
    }

    if (sourceId === "noor") {
      const data = await loadNoor();
      const idx = pageNumber - 1;
      if (idx >= 0 && idx < data.texts.length) {
        return data.texts[idx].replace(/\r\n/g, "\n").trim();
      }
      return "تفسير النور غير متوفر لهذه الصفحة.";
    }
  } catch {
    return "حدث خطأ في تحميل التفسير.";
  }
  return "تفسير غير معروف.";
}

export async function getAyahTafseer(
  idSurah: number,
  ayahNumber: number,
  sourceId: string,
  pageNumber?: number
): Promise<string> {
  const key = `${idSurah}:${ayahNumber}`;

  try {
    if (sourceId === "mizan") {
      const data = await loadMizan();
      // Mizan has no per-ayah index; fall back to the page tafseer that
      // contains this ayah (pageNumber is 1-based).
      const idx = pageNumber ? pageNumber - 1 : idSurah - 1;
      if (idx >= 0 && idx < data.texts.length) {
        return data.texts[idx].replace(/\r\n/g, "\n").trim();
      }
      return "تفسير الميزان غير متوفر لهذه الآية.";
    }

    if (sourceId === "amthal") {
      const index = await loadAmthalIndex();
      const data = await loadAmthal();
      const entryIdx = index[key];
      if (entryIdx !== undefined && entryIdx < data.texts.length) {
        return data.texts[entryIdx].replace(/\r\n/g, "\n").trim();
      }
      return "تفسير الأمثال غير متوفر لهذه الآية.";
    }

    if (sourceId === "noor") {
      const index = await loadNoorIndex();
      const data = await loadNoor();
      const entryIdx = index[key];
      if (entryIdx !== undefined && entryIdx < data.texts.length) {
        return data.texts[entryIdx].replace(/\r\n/g, "\n").trim();
      }
      return "تفسير النور غير متوفر لهذه الآية.";
    }
  } catch {
    return "حدث خطأ في تحميل التفسير.";
  }
  return "تفسير غير معروف.";
}
