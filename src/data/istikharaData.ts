import { IstikharaEntry } from "../types";

const istikharaDatabase: IstikharaEntry[] = [
  {
    pageNumber: 1,
    surahName: "الفاتحة",
    ayahNumber: 1,
    ayahText: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    verdict: "جيدة جداً",
    summary: "حمد الله على كل حال هو رب العالمين، دليل على البركة والتوفيق في البدء.",
    advice: "ابدأ بسم الله وتوكل على الله، فهذا الأمر مبارك بإذن الله.",
  },
  {
    pageNumber: 5,
    surahName: "المائدة",
    ayahNumber: 1,
    ayahText: "يَا أَيُّهَا الَّذِينَ آمَنُوا أَوْفُوا بِالْعُقُودِ",
    verdict: "جيدة",
    summary: "الأمر مطلوب فيه الوفاء بالعهد والعقد.",
    advice: "تأكد من التزاماتك وابدأ بالسم الله.",
  },
  {
    pageNumber: 45,
    surahName: "الجاثية",
    ayahNumber: 1,
    ayahText: "حم",
    verdict: "فيها مشقة ثم فرج",
    summary: "يدل على ثقل ومشقة في البداية لكن معها خير وفرج.",
    advice: "اصبر في البداية فالأمر سينجح مع بعض المشقة.",
  },
  {
    pageNumber: 293,
    surahName: "القلم",
    ayahNumber: 1,
    ayahText: "ن وَالْقَلَمِ وَمَا يَسْطُرُونَ",
    verdict: "جيدة جداً",
    summary: "قسم بالقلم دليل على أهمية العلم والمعرفة.",
    advice: "هذا الأمر يعتمد على التخطيط والتدوين، انطلق فيه بثقة.",
  },
  {
    pageNumber: 441,
    surahName: "الحاقة",
    ayahNumber: 1,
    ayahText: "الْحَاقَّةُ",
    verdict: "وسط",
    summary: "الحاقة واقعة لا محالة، الأمر واقعي.",
    advice: "评估 المتغيرات جيداً قبل البدء، ثم توكل.",
  },
  {
    pageNumber: 561,
    surahName: "المسد",
    ayahNumber: 1,
    ayahText: "تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ",
    verdict: "فيها مشقة ثم فرج",
    summary: "تحذير من الاندفاع.",
    advice: "لا تتسرع في هذا القرار، فهناك مخاطر يجب تجنبها.",
  },
  {
    pageNumber: 603,
    surahName: "الناس",
    ayahNumber: 1,
    ayahText: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
    verdict: "جيدة",
    summary: "لجوء إلى اللهProtection.",
    advice: "استعن بالله في هذا الأمر واحفظ نفسك من الشكوك.",
  },
];

function generateForPage(pageNumber: number): IstikharaEntry {
  const verdicts = ["جيدة جداً", "جيدة", "فيها مشقة ثم فرج", "وسط"];
  const hash = (pageNumber * 7 + 13) % 100;
  let verdict: string;
  if (hash < 25) verdict = "جيدة جداً";
  else if (hash < 50) verdict = "جيدة";
  else if (hash < 75) verdict = "فيها مشقة ثم فرج";
  else verdict = "وسط";

  const summaries = [
    "الآية تدل على التوفيق والبركة في هذا الأمر.",
    "القراءة تشير إلى وجود تحديات قابلة للحل بالصبر والتوكل.",
    "الفتح والخير في هذا الأمر بإذن الله مع التخطيط السليم.",
    "الأمر يتطلب مراجعة وتفحصاً دقيقاً قبل البدء.",
  ];

  const advices = [
    "ابدأ بسم الله واستشر المختصين.",
    "اصبر وتوكل على الله ولا تستعجل النتائج.",
    "هذا الوقت مناسب للبدء مع الحذر من التفريط.",
    "راجع قرارك مرة أخرى واختر أفضل الخيارات.",
  ];

  return {
    pageNumber,
    surahName: "القرآن الكريم",
    ayahNumber: (pageNumber % 10) + 1,
    ayahText: "بسم الله الرحمن الرحيم",
    verdict,
    summary: summaries[hash % summaries.length],
    advice: advices[hash % advices.length],
  };
}

export function getIstikharaForPage(pageNumber: number): IstikharaEntry | null {
  if (pageNumber < 1 || pageNumber > 603 || pageNumber % 2 === 0) return null;
  const existing = istikharaDatabase.find((e) => e.pageNumber === pageNumber);
  return existing || generateForPage(pageNumber);
}
