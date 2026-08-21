import React, { useState, useEffect } from "react";
import { IstikharaEntry, IstikharaHistoryItem } from "../types";
import {
  getIstikharaHistory,
  addIstikharaHistory,
  clearIstikharaHistory,
} from "../lib/storage";
import { haptic } from "../lib/haptics";
import AppButton from "./AppButton";
import {
  BookOpen,
  AlertTriangle,
  History,
  HelpCircle,
  Clock,
  Trash2,
  CheckCircle2,
  Compass,
  ArrowLeftRight,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";

interface IstikharaViewProps {
  showFeedback: (msg: string) => void;
}

export const IstikharaView: React.FC<IstikharaViewProps> = ({ showFeedback }) => {
  const [pageInput, setPageInput] = useState<string>("");
  const [result, setResult] = useState<IstikharaEntry | null>(null);
  const [allResults, setAllResults] = useState<{ business: string; transaction: string; marriage: string; ayahText: string; pageNumber: number } | null>(null);
  const [message, setMessage] = useState<string>("");
  const [history, setHistory] = useState<IstikharaHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [istikharaData, setIstikharaData] = useState<Record<string, string[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    getIstikharaHistory().then(setHistory);
  }, []);

  useEffect(() => {
    fetch("/data/istikharah/results.json")
      .then(res => res.json())
      .then(setIstikharaData)
      .catch(() => {});
  }, []);

  const handlePerformIstikhara = async () => {
    const pageNum = parseInt(pageInput, 10);
    if (!pageNum || pageNum < 1 || pageNum > 603 || pageNum % 2 === 0) {
      setMessage("أدخل صفحة فردية من 1 إلى 603.");
      setResult(null);
      haptic.warning();
      return;
    }
    const entry = istikharaData[String(pageNum)];
    if (!entry || !Array.isArray(entry) || entry.length < 4) {
      setMessage("لا توجد نتيجة لهذه الصفحة في الجدول.");
      setResult(null);
      haptic.warning();
      return;
    }

    const ayahInfo = entry[0] || "";

    const resultEntry: IstikharaEntry = {
      pageNumber: pageNum,
      surahName: ayahInfo.split("من سورة ")[1]?.split(":")[0] || "",
      ayahNumber: pageNum,
      ayahText: ayahInfo,
      verdict: "",
      summary: "",
      advice: "",
    };

    setResult(resultEntry);
    setAllResults({
      business: entry[1] || "",
      transaction: entry[2] || "",
      marriage: entry[3] || "",
      ayahText: ayahInfo,
      pageNumber: pageNum,
    });
    setSelectedCategory(null);
    const updatedHistory = await addIstikharaHistory("استخارة", pageNum, resultEntry);
    setHistory(updatedHistory);
    setMessage("");
    haptic.success();
    showFeedback("ظهرت نتيجة الجدول وحُفظ السجل محليًا");
  };

  const handleClearHistory = async () => {
    await clearIstikharaHistory();
    setHistory([]);
    haptic.light();
    showFeedback("تم مسح سجل الاستخارات");
  };

  const handleCopyResults = () => {
    if (!allResults) return;
    const text =
      `نتيجة الاستخارة — الصفحة ${allResults.pageNumber}\n\n` +
      `الآية: ${allResults.ayahText}\n\n` +
      `1. عام:\n${allResults.business}\n\n` +
      `2. معاملة:\n${allResults.transaction}\n\n` +
      `3. زواج:\n${allResults.marriage}\n\n` +
      `إذا وجدت أي خلل في النتيجة، يرجى إبلاغنا.`;
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        haptic.success();
        showFeedback("تم نسخ جميع النتائج");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        haptic.warning();
        showFeedback("تعذر النسخ على هذا الجهاز");
      });
  };

  const evaluateVerdict = (text: string) => {
    const lower = text.toLowerCase();
    const badPatterns = [
      "غير جيد", "غير جيدة", "سيئة", "سيئ", "الندامة", "ندامة",
      "ابتعد", "إتركه", "اتركه", "اترك", "لا تُقدم", "لا تفعل", "لا تبادر",
      "تخدع", "الخداع", "خداع", "تخسر", "خسارة", "حذار", "انتبه",
      "مشاكل", "اختلافات", "نزاع", "صعبة", "متعب", "ألم", "شر",
      "ضلال", "ضياع", "نكسة", "تُبتلى", "تبتلى", "ابتعاد", "تجنب",
      "فاسد", "فوضوي", "عديم", "معاناة", "مصائب", "مشقة", "كارثة",
    ];
    const goodPatterns = [
      "جيد جداً", "جيدة جداً", "ممتاز", "جيدة", "جيد",
      "حسن العاقبة", "مبروك", "مباركة", "خير", "نجاح", "سعادة", "فرح",
      "أنيس", "كفؤ", "مناسب", "توكل على الله", "بادر",
    ];
    if (badPatterns.some((p) => lower.includes(p))) return "bad";
    if (goodPatterns.some((p) => lower.includes(p))) return "good";
    return "neutral";
  };

  // 1. Spelling correction (only fixes "انشاء الله" and "بأذن الله")
  const fixSpelling = (text: string): string => {
    if (!text) return text;
    let t = text;
    t = t.replace(/انشاء\s*الله/gi, "إن شاء الله");
    t = t.replace(/بأذن\s*الله/gi, "بإذن الله");
    return t;
  };

  // 2. Master color detection — derived ONLY from the "عام" (business) text
  const detectMasterColor = (text: string): "red" | "green" | "orange" => {
    const lower = (text || "").toLowerCase();
    // Highest priority: cut/prohibition words -> red
    if (/(لا تفعل|ممنوع|كارثة|شر|صعب جدا|غير مناسب|لا خير|ابتعد|اترك|لا تبادر|لا تُقدم)/.test(lower)) return "red";
    // Good news words -> green
    if (/(ممتاز|مبارك|خير كبير|فرج|سهل|ميسر|إن شاء الله خير|محظوظ|جيد|خير|نجاح|مبروك)/.test(lower)) return "green";
    // Everything else -> orange (safe)
    return "orange";
  };

  // 3. Master color applied to ALL cards (from the "عام" text only)
  const masterColor = allResults ? detectMasterColor(fixSpelling(allResults.business)) : "orange";

  const colorStyles: Record<string, { card: string; badge: string; label: string }> = {
    red: {
      card: "bg-rose-50/90 border-rose-500 text-rose-950 shadow-md shadow-rose-200 ring-2 ring-rose-400",
      badge: "bg-rose-600 text-white",
      label: "سيئة ⚠️",
    },
    green: {
      card: "bg-emerald-50/90 border-emerald-500 text-emerald-950 shadow-md shadow-emerald-200 ring-2 ring-emerald-400",
      badge: "bg-emerald-600 text-white",
      label: "جيدة ✨",
    },
    orange: {
      card: "bg-amber-50/90 border-amber-500 text-amber-950 shadow-md shadow-amber-200 ring-2 ring-amber-400",
      badge: "bg-amber-600 text-white",
      label: "متوسطة",
    },
  };

  const displayText = (text: string): string => {
    const fixed = fixSpelling(text);
    if (!fixed || !fixed.trim()) return "لم يرد نص لهذا القسم";
    return fixed;
  };

  return (
    <div id="istikhara-container" className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-[32px] bg-white border border-[#E6E0D8] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="absolute top-0 left-0 w-1.5 bg-[#4A5D4E] h-full" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-[#F1EFEC] text-[#4A5D4E] flex items-center justify-center font-bold">
              <Compass className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-black font-serif">استخارة القرآن الكريم</h2>
              <p className="text-xs text-[#8C7E6E]">جدول كشف الاستخارة بالصفحات الفردية من 1 إلى 603 مع بيان النتيجة والنصيحة</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AppButton variant="outline" size="sm" icon={<HelpCircle className="w-3.5 h-3.5" />} onPress={() => setShowGuide(!showGuide)}>
              {showGuide ? "إخفاء الآداب" : "آداب الاستخارة"}
            </AppButton>
            <AppButton variant="secondary" size="sm" icon={<History className="w-3.5 h-3.5" />} onPress={() => setShowHistory(!showHistory)}>
              السجل ({history.length})
            </AppButton>
          </div>
        </div>
        {showGuide && (
          <div className="p-5 rounded-2xl bg-[#F1EFEC] border border-[#E6E0D8] text-xs text-black space-y-4 mt-4 leading-relaxed">
            <h4 className="font-bold text-[#4A5D4E] flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4" /> آداب الاستخارة — من سفينة النجاة:
            </h4>
            <div className="bg-white rounded-2xl p-4 border border-[#E6E0D8] font-serif text-base text-black leading-[2.2] text-justify space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-black pr-1">
                <li>اقرأ <strong>سورة التوحيد</strong> (3 مرات).</li>
                <li>صلِّ على <strong>محمد وآل محمد</strong> (3 مرات).</li>
                <li>قل: <strong>أستخير الله برحمته خيرةً في عافية</strong> (3 مرات).</li>
              </ol>
              <div className="pt-2 border-t border-[#E6E0D8]">
                <p className="text-center font-bold text-[#4A5D4E]">يا دليل المتحيرين يا الله، يا من يعلم إهدِ من لا يعلم، إهدنا الصراط المستقيم</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-[32px] bg-white border border-[#E6E0D8] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-black">رقم الصفحة الفردية (1 - 603):</label>
          <input id="istikhara-page-input" type="number" min="1" max="603" step="2" value={pageInput} onChange={(e) => setPageInput(e.target.value)} placeholder="مثال: 1, 5, 293, 441" className="w-full px-4 py-2.5 rounded-2xl bg-[#F1EFEC] border border-[#E6E0D8] text-sm text-black placeholder-[#8C7E6E] focus:outline-none focus:border-[#4A5D4E] font-mono" />
        </div>

        {message && (
          <div id="istikhara-message-alert" className="p-4 rounded-2xl bg-[#FFE5D9] border border-[#FFD0BD] text-[#8C4E3E] text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#8C4E3E] shrink-0" />
            <span>{message}</span>
          </div>
        )}
        <div className="flex justify-end pt-2">
          <AppButton id="perform-istikhara-btn" variant="primary" size="lg" className="w-full sm:w-auto" icon={<Compass className="w-4 h-4" />} onPress={handlePerformIstikhara}>
            كشف نتيجة الاستخارة
          </AppButton>
        </div>
      </div>

      {result && allResults && (
        <div id="istikhara-result-card" className="space-y-4">
          <div className="rounded-[32px] bg-white border border-[#E6E0D8] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-[#8C7E6E]">نتيجة الصفحة {allResults.pageNumber}</span>
              <span className="text-[11px] text-[#4A5D4E] font-bold">اضغط على أي قسم أدناه للتفاعل</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#F1EFEC] border border-[#E6E0D8] text-center font-serif text-lg text-black leading-loose">
              « {allResults.ayahText} »
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[
              { key: "business" as const, label: "1. عام", icon: "🌐", text: allResults.business },
              { key: "transaction" as const, label: "2. معاملة", icon: "🤝", text: allResults.transaction },
              { key: "marriage" as const, label: "3. زواج", icon: "💍", text: allResults.marriage },
            ].map((cat) => {
              const isSelected = selectedCategory === cat.key;
              const style = colorStyles[masterColor];

              // All cards share the SAME master color (derived from "عام" only)
              const glowStyle = `border-2 ${style.card}`;
              const badgeStyle = style.badge;

              return (
                <div
                  key={cat.key}
                  onClick={() => {
                    setSelectedCategory(isSelected ? null : cat.key);
                    haptic.light();
                    showFeedback(`تم اختيار ${cat.label}`);
                  }}
                  className={`rounded-[28px] p-6 cursor-pointer transition-all duration-200 active:scale-[0.99] select-none ${glowStyle} ${isSelected ? "scale-[1.01] shadow-xl" : ""}`}
                >
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-current/20">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{cat.icon}</span>
                      <h4 className="text-lg font-bold font-serif">{cat.label}</h4>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeStyle}`}>
                      {style.label}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed font-serif">{displayText(cat.text)}</p>
                </div>
              );
            })}
          </div>

          {/* Copy results + disclaimer */}
          <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-5 shadow-xs space-y-3">
            <AppButton variant="primary" size="lg" className="w-full" icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} onPress={handleCopyResults}>
              {copied ? "تم نسخ جميع النتائج ✓" : "نسخ جميع النتائج"}
            </AppButton>
            <p className="text-[11px] text-[#8C7E6E] text-center leading-relaxed">
              ⚠️ إذا وجدت أي خلل في النتيجة يرجى <span className="font-bold text-[#4A5D4E]">الإبلاغ عنه</span> عبر الإعدادات.
            </p>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="rounded-[32px] bg-white border border-[#E6E0D8] p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-black flex items-center gap-2">
              <History className="w-4 h-4 text-[#4A5D4E]" /> سجل الاستخارات ({history.length})
            </h3>
            {history.length > 0 && (
              <button type="button" onClick={handleClearHistory} className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer font-semibold">
                <Trash2 className="w-3.5 h-3.5" /> مسح السجل
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-[#8C7E6E] text-center py-8">لا توجد استخارات سابقة مسجلة.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {history.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-[#F1EFEC] border border-[#E6E0D8] flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black text-sm font-serif">{item.purpose || "نية عامة"}</span>
                      <span className="text-[#8C7E6E] font-mono">(ص {item.pageNumber})</span>
                    </div>
                    <p className="text-[#8C7E6E] line-clamp-1">{item.entry.summary}</p>
                    <span className="text-[10px] text-[#8C7E6E] block">{new Date(item.timestamp).toLocaleString("ar-EG")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IstikharaView;
