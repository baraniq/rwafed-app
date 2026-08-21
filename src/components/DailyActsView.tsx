import React, { useState, useEffect } from "react";
import { haptic } from "../lib/haptics";
import { getReflection, saveReflection } from "../lib/storage";
import { toNumeral, getNumeralSystem, NumeralSystem } from "../lib/numerals";
import { ReflectionChecklist } from "../types";
import { loadSafinaCategory, SafinaDuaItem } from "../data/devotionsData";
import AppButton from "./AppButton";
import {
  CheckCircle2,
  Circle,
  RotateCcw,
  HeartHandshake,
  Plus,
  X,
  CheckSquare,
  Square,
  Sparkles,
  BookOpen,
  Copy,
  Check,
} from "lucide-react";

interface DailyActsViewProps {
  showFeedback: (msg: string) => void;
}

const EMPTY: ReflectionChecklist = {
  fajrOnTime: false,
  dhuhrAsrOnTime: false,
  maghribIshaOnTime: false,
  quranRead: false,
  tasbeehDone: false,
  charityOrHelp: false,
  tongueGuarded: false,
  parentsRespect: false,
  notes: "",
  date: new Date().toISOString().split("T")[0],
};

interface CustomAct {
  id: string;
  label: string;
  done: boolean;
}

const WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function getTodayName(): string {
  const names = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  return names[new Date().getDay()];
}

export const DailyActsView: React.FC<DailyActsViewProps> = ({ showFeedback }) => {
  const [tab, setTab] = useState<"daily" | "reflection">("daily");
  const [dailyDone, setDailyDone] = useState<boolean[]>(Array(7).fill(false));
  const [loading, setLoading] = useState<boolean>(true);
  const [safinaDuas, setSafinaDuas] = useState<SafinaDuaItem[]>([]);
  const [selectedAct, setSelectedAct] = useState<SafinaDuaItem | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [fontSize, setFontSize] = useState<number>(20);
  const [copied, setCopied] = useState<boolean>(false);

  // --- Reflection ---
  const [reflection, setReflection] = useState<ReflectionChecklist>(EMPTY);
  const [customActs, setCustomActs] = useState<CustomAct[]>([]);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [newActLabel, setNewActLabel] = useState<string>("");
  const [numeral, setNumeral] = useState<NumeralSystem>("western");

  const todayStr = () => new Date().toISOString().split("T")[0];
  const todayName = getTodayName();

  useEffect(() => {
    // Load all safina data needed for daily acts
    Promise.all([
      loadSafinaCategory("dua"),
      loadSafinaCategory("zeara"),
      loadSafinaCategory("p_nawafel"),
    ]).then(([duas, ziyarat, prayers]) => {
      setSafinaDuas([...duas, ...ziyarat, ...prayers]);
      setLoading(false);
    }).catch(() => setLoading(false));

    getReflection().then((r) => {
      const today = todayStr();
      if (r.date !== today) setReflection({ ...EMPTY, date: today });
      else setReflection(r);
    });

    const saved = localStorage.getItem("naseem_daily_acts");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.date === todayStr()) setDailyDone(parsed.done);
      } catch { /* ignore */ }
    }
    const customSaved = localStorage.getItem("naseem_custom_acts");
    if (customSaved) {
      try { setCustomActs(JSON.parse(customSaved)); } catch { /* ignore */ }
    }
    setNumeral(getNumeralSystem());
  }, []);

  const saveDaily = (done: boolean[]) => {
    setDailyDone(done);
    localStorage.setItem("naseem_daily_acts", JSON.stringify({ date: todayStr(), done }));
  };

  const toggleDaily = (idx: number) => {
    const next = [...dailyDone];
    next[idx] = !next[idx];
    saveDaily(next);
    haptic.light();
  };

  const resetDaily = () => {
    const fresh = Array(7).fill(false);
    saveDaily(fresh);
    haptic.light();
    showFeedback("تم تصفير أعمال اليوم");
  };

  // Build the 7 daily acts with their lookup logic
  const buildActs = (): { label: string; sub: string; find: () => SafinaDuaItem | undefined }[] => {
    // The data files are inconsistent: some use "الاحد"/"الاربعاء" (plain alif) and
    // some use "الأحد"/"الأربعاء" (alif with hamza). We replace every hamza-carrying
    // alif (أ/إ/آ) with a plain alif (ا) so the lookup matches regardless of spelling.
    const normalizeDay = (name: string): string => name.replace(/[أإآ]/g, "ا");
    const dayKey = normalizeDay(todayName); // e.g. "الاربعاء"
    const dayVariants = [todayName, dayKey]; // e.g. ["الأربعاء", "الاربعاء"]

    const search = (pred: (i: SafinaDuaItem) => boolean) => safinaDuas.find(pred);
    const byTitle = (t: string) => search((i) => i.titleAr.trim() === t || i.titleAr.includes(t));
    const byDayAndCat = (cat: string, prefix: string) =>
      search((i) => i.safinaCategory === cat && i.titleAr.startsWith(prefix));

    // Try each day spelling variant until one matches.
    const findDayInCat = (cat: string, prefixBase: string) =>
      dayVariants
        .map((v) => search((i) => i.safinaCategory === cat && i.titleAr.startsWith(`${prefixBase} ${v}`)))
        .find(Boolean);

    return [
      {
        label: "دعاء اليوم",
        sub: `دعاء يوم ${todayName}`,
        find: () => byTitle(`دعاء يوم ${dayKey}`) || byTitle(`دعاء يوم ${todayName}`),
      },
      {
        label: "زيارة المعصوم المخصوصة",
        sub: `زيارة اليوم: ${todayName}`,
        find: () => search((i) => i.safinaCategory === "zeara" && (i.titleAr.startsWith(`يوم ${dayKey} - زيارة`) || i.titleAr.startsWith(`يوم ${todayName} - زيارة`))),
      },
      {
        label: "زيارة الحجة بعد الفجر",
        sub: "زيارة الإمام المهدي (عج) بعد صلاة الصبح",
        find: () => byTitle("زيارة الحجة (ع) بعد صلاة الصبح"),
      },
      {
        label: "دعاء الصباح",
        sub: "دعاء الصباح المأثور",
        find: () => byTitle("دعاء الصباح"),
      },
      {
        label: "زيارة وارث",
        sub: "زيارة وارث المباركة",
        find: () => byTitle("زيارة وارث"),
      },
      {
        label: "صلاة اليوم",
        sub: `صلاة يوم ${todayName}`,
        find: () => findDayInCat("p_nawafel", "صلاة يوم"),
      },
      {
        label: "دعاء التوسل",
        sub: "دعاء التوسل بالأئمة المعصومين",
        find: () => byTitle("دعاء التوسل"),
      },
    ];
  };

  const acts = buildActs();

  const openAct = (act: { label: string; find: () => SafinaDuaItem | undefined }) => {
    haptic.light();
    if (loading) {
      showFeedback("جاري تحميل البيانات...");
      return;
    }
    const item = act.find();
    if (!item) {
      showFeedback("لم يتم العثور على محتوى هذا العمل");
      return;
    }
    setSelectedLabel(act.label);
    setSelectedAct(item);
  };

  const actText = selectedAct?.paragraphs.map((p) => p.arabic).filter(Boolean).join("\n\n") || "";

  // --- Reflection helpers ---
  const reflectionItems: { key: keyof ReflectionChecklist; label: string }[] = [
    { key: "fajrOnTime", label: "أداء صلاة الفجر في أول وقتها حاضرًا" },
    { key: "dhuhrAsrOnTime", label: "أداء صلاتي الظهر والعصر بخشوع وتوجه" },
    { key: "maghribIshaOnTime", label: "أداء صلاتي المغرب والعشاء وتعقيباتها" },
    { key: "quranRead", label: "تلاوة ورد يومي من القرآن الكريم مع التدبر" },
    { key: "tasbeehDone", label: "تسبيح الزهراء (ع) أو الاستغفار والصلاة على النبي وآله" },
    { key: "charityOrHelp", label: "بذل صدقة أو مساعدة محتاج أو إدخال سرور" },
    { key: "tongueGuarded", label: "حفظ اللسان من الغيبة والكذب والمراء" },
    { key: "parentsRespect", label: "بر الوالدين وصلة الرحم والإحسان للأهل" },
  ];

  const toggleReflection = async (key: keyof ReflectionChecklist) => {
    const updated = { ...reflection, [key]: !reflection[key] };
    setReflection(updated);
    await saveReflection(updated);
    haptic.light();
  };

  const toggleCustom = (id: string) => {
    const next = customActs.map((a) => (a.id === id ? { ...a, done: !a.done } : a));
    setCustomActs(next);
    localStorage.setItem("naseem_custom_acts", JSON.stringify(next));
    haptic.light();
  };

  const addCustomAct = () => {
    const label = newActLabel.trim();
    if (!label) return;
    const newAct: CustomAct = { id: `act_${Date.now()}`, label, done: false };
    const next = [...customActs, newAct];
    setCustomActs(next);
    localStorage.setItem("naseem_custom_acts", JSON.stringify(next));
    setNewActLabel("");
    setShowAdd(false);
    haptic.success();
    showFeedback("تمت إضافة العمل");
  };

  const removeCustomAct = (id: string) => {
    const next = customActs.filter((a) => a.id !== id);
    setCustomActs(next);
    localStorage.setItem("naseem_custom_acts", JSON.stringify(next));
    haptic.light();
  };

  const reflectionCount = reflectionItems.filter((i) => reflection[i.key]).length + customActs.filter((a) => a.done).length;
  const reflectionTotal = reflectionItems.length + customActs.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="rounded-[32px] bg-white border border-[#E6E0D8] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-[#F1EFEC] text-[#4A5D4E] flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-black font-serif">أعمال اليوم</h2>
            <p className="text-xs text-[#8C7E6E]">أعمالك اليومية ومحاسبة النفس</p>
          </div>
        </div>

        <div className="flex items-center p-1 rounded-full bg-[#F1EFEC] border border-[#E6E0D8]">
          <button
            type="button"
            onClick={() => { setTab("daily"); haptic.light(); }}
            className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${tab === "daily" ? "bg-[#4A5D4E] text-white" : "text-[#8C7E6E]"}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> أعمال اليوم
          </button>
          <button
            type="button"
            onClick={() => { setTab("reflection"); haptic.light(); }}
            className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${tab === "reflection" ? "bg-[#4A5D4E] text-white" : "text-[#8C7E6E]"}`}
          >
            <HeartHandshake className="w-3.5 h-3.5" /> محاسبة النفس
          </button>
        </div>
      </div>

      {/* Daily Acts Tab */}
      {tab === "daily" && (
        <div className="space-y-3">
          <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-black">أعمال اليوم</h3>
                <p className="text-[10px] text-[#8C7E6E] mt-0.5">اليوم: {todayName} — اضغط على العمل لقراءته</p>
              </div>
              <button
                type="button"
                onClick={resetDaily}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F1EFEC] text-[#8C7E6E] text-xs font-bold hover:text-black cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> تصفير
              </button>
            </div>
            <div className="w-full h-2 rounded-full bg-[#E6E0D8]">
              <div className="h-full rounded-full bg-[#4A5D4E] transition-all" style={{ width: `${(dailyDone.filter(Boolean).length / 7) * 100}%` }} />
            </div>
          </div>

          {acts.map((act, idx) => {
            const done = dailyDone[idx];
            const found = !loading && !!act.find();
            return (
              <div
                key={act.label}
                onClick={() => openAct(act)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-right cursor-pointer transition-all ${
                  done ? "bg-[#D4E2D5]/30 border-[#B8CEBA]" : "bg-white border-[#E6E0D8] hover:border-[#4A5D4E]"
                }`}
              >
                <span onClick={(e) => { e.stopPropagation(); toggleDaily(idx); }} className="shrink-0 cursor-pointer">
                  {done ? (
                    <CheckCircle2 className="w-6 h-6 text-[#4A5D4E]" />
                  ) : (
                    <Circle className="w-6 h-6 text-[#8C7E6E]" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold ${done ? "text-black line-through" : "text-black"}`}>{act.label}</div>
                  <div className="text-[11px] text-[#8C7E6E]">{act.sub}</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openAct(act); }}
                  title={`قراءة ${act.label}`}
                  aria-label={`قراءة ${act.label}`}
                  className="shrink-0 w-9 h-9 rounded-xl bg-[#F1EFEC] border border-[#E6E0D8] text-[#4A5D4E] hover:bg-[#D4E2D5] flex items-center justify-center cursor-pointer transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Reflection Tab */}
      {tab === "reflection" && (
        <div className="space-y-3">
          <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-black">محاسبة النفس اليومية</h3>
                <p className="text-[10px] text-[#8C7E6E] mt-0.5">«حاسبوا أنفسكم قبل أن تحاسبوا»</p>
              </div>
               <span className="text-xs font-bold px-4 py-2 rounded-full bg-[#D4E2D5] text-black">
                 {toNumeral(reflectionCount, numeral)} / {toNumeral(reflectionTotal, numeral)} ({toNumeral(reflectionTotal ? Math.round((reflectionCount / reflectionTotal) * 100) : 0, numeral)}%)
               </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reflectionItems.map((item) => {
              const checked = reflection[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => toggleReflection(item.key)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                    checked ? "bg-[#D4E2D5]/40 border-[#B8CEBA] text-black" : "bg-white border-[#E6E0D8] text-black hover:border-[#D4CEBE]"
                  }`}
                >
                  <span className="shrink-0 text-[#4A5D4E]">
                    {checked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-[#8C7E6E]" />}
                  </span>
                  <span className="text-xs font-bold leading-snug">{item.label}</span>
                </div>
              );
            })}

            {customActs.map((act) => (
              <div
                key={act.id}
                onClick={() => toggleCustom(act.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                  act.done ? "bg-[#D4E2D5]/40 border-[#B8CEBA] text-black" : "bg-white border-[#E6E0D8] text-black hover:border-[#D4CEBE]"
                }`}
              >
                <span className="shrink-0 text-[#4A5D4E]">
                  {act.done ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-[#8C7E6E]" />}
                </span>
                <span className="text-xs font-bold leading-snug flex-1">{act.label}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeCustomAct(act.id); }}
                  className="shrink-0 p-1 rounded-lg text-[#8C7E6E] hover:text-black hover:bg-[#E6E0D8] cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {showAdd ? (
            <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-4 shadow-xs space-y-3">
              <input
                type="text"
                value={newActLabel}
                onChange={(e) => setNewActLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addCustomAct(); }}
                placeholder="اكتب العمل الذي تريد محاسبة نفسك عليه..."
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F1EFEC] border border-[#E6E0D8] text-sm focus:outline-none focus:border-[#4A5D4E]"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 rounded-xl bg-[#F1EFEC] text-[#8C7E6E] text-xs font-bold cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={addCustomAct}
                  disabled={!newActLabel.trim()}
                  className="px-4 py-2 rounded-xl bg-[#4A5D4E] text-white text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                >
                  إضافة العمل
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-white border-2 border-dashed border-[#E6E0D8] text-[#4A5D4E] text-sm font-bold cursor-pointer hover:border-[#4A5D4E] transition-colors"
            >
              <Plus className="w-4 h-4" /> إضافة عمل
            </button>
          )}
        </div>
      )}

      {/* Act reader modal */}
      {selectedAct && (
        <div
          className="fixed inset-0 z-50 bg-[#F9F7F5] flex flex-col"
          onClick={() => { setSelectedAct(null); setCopied(false); }}
        >
          <div className="w-full h-full flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-[#F9F7F5]">
              <div className="text-center space-y-2 pt-2 pb-5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#D4E2D5] text-black text-[11px] font-bold">{selectedLabel}</span>
                <h3 className="text-xl font-bold font-serif text-black">{selectedAct.titleAr}</h3>
              </div>
              <div className="text-right font-serif leading-loose text-black whitespace-pre-line" style={{ fontSize: `${fontSize}px`, lineHeight: "2.4" }}>
                {actText}
              </div>
            </div>
            <div className="p-4 border-t border-[#E6E0D8] bg-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(actText); setCopied(true); haptic.success(); showFeedback("تم النسخ"); setTimeout(() => setCopied(false), 2000); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F1EFEC] text-[#4A5D4E] border border-[#E6E0D8] text-xs font-bold cursor-pointer transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />} {copied ? "تم النسخ" : "نسخ"}
                </button>
                <div className="flex items-center rounded-xl bg-white border border-[#E6E0D8] p-0.5">
                  <button type="button" onClick={() => setFontSize((s) => Math.max(14, s - 2))} className="px-2 py-1 text-xs text-[#8C7E6E] hover:text-black cursor-pointer font-bold">-A</button>
                  <span className="text-xs px-1.5 text-[#4A5D4E] font-bold">{fontSize}</span>
                  <button type="button" onClick={() => setFontSize((s) => Math.min(36, s + 2))} className="px-2 py-1 text-xs text-[#8C7E6E] hover:text-black cursor-pointer font-bold">+A</button>
                </div>
              </div>
              <AppButton variant="primary" size="sm" onPress={() => { setSelectedAct(null); setCopied(false); haptic.light(); }}>إغلاق</AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyActsView;