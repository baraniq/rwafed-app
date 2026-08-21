import React, { useState, useEffect } from "react";
import { QadaState } from "../types";
import {
  getQada,
  saveQada,
} from "../lib/storage";
import { haptic } from "../lib/haptics";
import { toNumeral, getNumeralSystem, parseNumeral, NumeralSystem } from "../lib/numerals";
import AppButton from "./AppButton";
import { TasbeehView } from "./TasbeehView";
import {
  Calculator,
  Plus,
  Minus,
  RotateCcw,
  CheckCircle2,
  Award,
  CircleDot,
  Coins,
  Scale,
} from "lucide-react";

interface CalculatorsViewProps {
  showFeedback: (msg: string) => void;
  defaultSection?: "tasbeeh" | "qada" | "inheritance" | "khums";
}

export const CalculatorsView: React.FC<CalculatorsViewProps> = ({
  showFeedback,
  defaultSection = "tasbeeh",
}) => {
  const [activeSection, setActiveSection] = useState<"tasbeeh" | "qada" | "inheritance" | "khums">(defaultSection);

  useEffect(() => {
    if (defaultSection) {
      setActiveSection(defaultSection);
    }
  }, [defaultSection]);

  const [estateAmount, setEstateAmount] = useState<number>(100000);
  const [hasFather, setHasFather] = useState<boolean>(true);
  const [hasMother, setHasMother] = useState<boolean>(true);
  const [hasSpouse, setHasSpouse] = useState<boolean>(true);
  const [spouseType, setSpouseType] = useState<"husband" | "wife">("wife");
  const [sonsCount, setSonsCount] = useState<number>(2);
  const [daughtersCount, setDaughtersCount] = useState<number>(1);

  const [cashSavings, setCashSavings] = useState<number>(5000);
  const [surplusGoods, setSurplusGoods] = useState<number>(1000);
  const [debtsOwedToUser, setDebtsOwedToUser] = useState<number>(0);
  const [immediateDebts, setImmediateDebts] = useState<number>(1000);

  const [qada, setQada] = useState<QadaState>({
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
    fasting: 0,
  });

  const [message, setMessage] = useState<string>("");
  const [numeral, setNumeral] = useState<NumeralSystem>("western");

  useEffect(() => {
    getQada().then(setQada);
    setNumeral(getNumeralSystem());
  }, []);

  const saveQadaForm = async () => {
    await saveQada(qada);
    haptic.success();
    setMessage("حُفظ سجل القضاء على هذا الجهاز.");
    showFeedback("حُفظ سجل القضاء على هذا الجهاز.");
    setTimeout(() => setMessage(""), 3000);
  };

  const qadaFields = [
    { key: "fajr" as const, label: "صلاة الفجر (الصبح)", color: "text-[#4A5D4E]" },
    { key: "dhuhr" as const, label: "صلاة الظهر", color: "text-[#4A5D4E]" },
    { key: "asr" as const, label: "صلاة العصر", color: "text-[#4A5D4E]" },
    { key: "maghrib" as const, label: "صلاة المغرب", color: "text-[#4A5D4E]" },
    { key: "isha" as const, label: "صلاة العشاء", color: "text-[#4A5D4E]" },
    { key: "fasting" as const, label: "صيام الأيام (القضاء)", color: "text-[#8C4E3E]" },
  ];

  const totalPrayersCount =
    qada.fajr + qada.dhuhr + qada.asr + qada.maghrib + qada.isha;

  return (
    <div id="calculators-container" className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-wrap items-center p-1 rounded-2xl sm:rounded-full bg-[#F1EFEC] border border-[#E6E0D8] shadow-xs gap-1">
        <button
          id="tab-tasbeeh-btn"
          type="button"
          onClick={() => { setActiveSection("tasbeeh"); haptic.light(); }}
          className={`flex-1 min-w-[110px] py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSection === "tasbeeh" ? "bg-[#4A5D4E] text-white shadow-xs" : "text-[#8C7E6E] hover:text-[#2D241E]"
          }`}
        >
          <CircleDot className="w-3.5 h-3.5" />
          <span>المسبحة</span>
        </button>
        <button
          id="tab-qada-btn"
          type="button"
          onClick={() => { setActiveSection("qada"); haptic.light(); }}
          className={`flex-1 min-w-[110px] py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSection === "qada" ? "bg-[#4A5D4E] text-white shadow-xs" : "text-[#8C7E6E] hover:text-[#2D241E]"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>صلوات القضاء</span>
        </button>
        <button
          id="tab-inheritance-btn"
          type="button"
          onClick={() => { setActiveSection("inheritance"); haptic.light(); }}
          className={`flex-1 min-w-[110px] py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSection === "inheritance" ? "bg-[#4A5D4E] text-white shadow-xs" : "text-[#8C7E6E] hover:text-[#2D241E]"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>المواريث</span>
        </button>
        <button
          id="tab-khums-btn"
          type="button"
          onClick={() => { setActiveSection("khums"); haptic.light(); }}
          className={`flex-1 min-w-[110px] py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSection === "khums" ? "bg-[#4A5D4E] text-white shadow-xs" : "text-[#8C7E6E] hover:text-[#2D241E]"
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>حاسبة الخمس</span>
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-[#D4E2D5] border border-[#B8CEBA] text-[#2D4232] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#4A5D4E] shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {activeSection === "tasbeeh" && (
        <TasbeehView showFeedback={showFeedback} />
      )}

      {activeSection === "qada" && (
        <div className="rounded-[32px] bg-white border border-[#E6E0D8] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E0D8] pb-5">
            <div>
              <h3 className="text-xl font-bold text-[#2D241E] flex items-center gap-2 font-serif">
                <Calculator className="w-5 h-5 text-[#4A5D4E]" />
                سجل وحاسبة قضاء الصلوات والصيام
              </h3>
              <p className="text-xs text-[#8C7E6E] mt-1">
                تتبع الصلوات والصيام الفائت، وسجّل ما تقضيه يومياً لنيل براءة الذمة
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#2D4232] font-bold px-4 py-2 rounded-full bg-[#D4E2D5]">
              <span>مجموع الصلوات المطلوبة: {toNumeral(totalPrayersCount, numeral)}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {qadaFields.map((field) => (
              <div key={field.key} className="p-5 rounded-2xl bg-[#F1EFEC] border border-[#E6E0D8] flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${field.color}`}>{field.label}</span>
                  <span className="font-mono text-xl font-extrabold text-[#2D241E]">{toNumeral(qada[field.key], numeral)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setQada((q) => ({ ...q, [field.key]: Math.max(0, q[field.key] - 1) })); haptic.light(); }}
                    className="flex-1 py-2 rounded-xl bg-white hover:bg-[#E6E0D8] text-[#2D241E] text-xs font-bold border border-[#E6E0D8] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    قضيت صلاة
                  </button>
                  <button
                    type="button"
                    onClick={() => { setQada((q) => ({ ...q, [field.key]: q[field.key] + 1 })); haptic.light(); }}
                    className="p-2 rounded-xl bg-[#4A5D4E] hover:bg-[#3d4d40] text-white cursor-pointer transition-colors"
                    title="إضافة صلاة قضاء"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <AppButton id="save-qada-btn" variant="primary" size="lg" icon={<CheckCircle2 className="w-4 h-4" />} onPress={saveQadaForm}>
              حفظ سجل القضاء
            </AppButton>
          </div>
        </div>
      )}

      {activeSection === "inheritance" && (
        <div className="rounded-[32px] bg-white border border-[#E6E0D8] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E6E0D8] pb-5">
            <h3 className="text-xl font-bold text-[#2D241E] flex items-center gap-2 font-serif">
              <Award className="w-5 h-5 text-[#4A5D4E]" />
              حاسبة المواريث الشرعية (الطبقة الأولى - الفقه الجعفري)
            </h3>
            <p className="text-xs text-[#8C7E6E] mt-1">
              حساب حصص الورثة بدقة وفق فقه أهل البيت (عليهم السلام) لأفراد الطبقة الأولى
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2D241E] mb-1.5">قيمة التركة الصافية:</label>
                 <div className="flex items-center rounded-2xl bg-[#F1EFEC] border border-[#E6E0D8] px-4 py-2.5">
                   <input type="text" inputMode="numeric" value={estateAmount === 0 ? "" : toNumeral(estateAmount, numeral)} onChange={(e) => setEstateAmount(Math.max(0, parseNumeral(e.target.value)))} className="w-full bg-transparent text-sm font-bold text-[#2D241E] focus:outline-none" placeholder="0" />
                   <span className="text-xs font-bold text-[#8C7E6E]">د.ع / ريال</span>
                 </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E0D8] space-y-3">
                <div className="text-xs font-bold text-[#4A5D4E] mb-2">أفراد الطبقة الأولى الموجودون:</div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#2D241E] cursor-pointer">
                    <input type="checkbox" checked={hasFather} onChange={(e) => setHasFather(e.target.checked)} className="rounded accent-[#4A5D4E] w-4 h-4" />
                    الأب على قيد الحياة
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-[#2D241E] cursor-pointer">
                    <input type="checkbox" checked={hasMother} onChange={(e) => setHasMother(e.target.checked)} className="rounded accent-[#4A5D4E] w-4 h-4" />
                    الأم على قيد الحياة
                  </label>
                </div>
                <div className="pt-2 border-t border-[#E6E0D8]/60 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#2D241E] cursor-pointer">
                    <input type="checkbox" checked={hasSpouse} onChange={(e) => setHasSpouse(e.target.checked)} className="rounded accent-[#4A5D4E] w-4 h-4" />
                    يوجد زوج / زوجة
                  </label>
                  {hasSpouse && (
                    <div className="flex items-center gap-4 pr-6 pt-1">
                      <label className="flex items-center gap-1.5 text-xs text-[#2D241E] cursor-pointer">
                        <input type="radio" name="spouseType" checked={spouseType === "wife"} onChange={() => setSpouseType("wife")} className="accent-[#4A5D4E]" />
                        الزوجة
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-[#2D241E] cursor-pointer">
                        <input type="radio" name="spouseType" checked={spouseType === "husband"} onChange={() => setSpouseType("husband")} className="accent-[#4A5D4E]" />
                        الزوج
                      </label>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-[#E6E0D8]/60 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#2D241E] mb-1">عدد الأبناء (ذكور):</label>
                    <input type="text" inputMode="numeric" value={sonsCount === 0 ? "" : toNumeral(sonsCount, numeral)} onChange={(e) => setSonsCount(Math.max(0, parseNumeral(e.target.value)))} className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E6E0D8] text-xs font-bold text-[#2D241E]" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#2D241E] mb-1">عدد البنات (إناث):</label>
                    <input type="text" inputMode="numeric" value={daughtersCount === 0 ? "" : toNumeral(daughtersCount, numeral)} onChange={(e) => setDaughtersCount(Math.max(0, parseNumeral(e.target.value)))} className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E6E0D8] text-xs font-bold text-[#2D241E]" placeholder="0" />
                  </div>
                </div>
              </div>
            </div>
            {(() => {
              const totalChildren = sonsCount + daughtersCount;
              const hasChildren = totalChildren > 0;
              let spouseShareFrac = 0;
              let spouseLabel = "";
              if (hasSpouse) {
                if (spouseType === "wife") {
                  spouseShareFrac = hasChildren ? 1 / 8 : 1 / 4;
                  spouseLabel = hasChildren ? "الزوجة (1/8)" : "الزوجة (1/4)";
                } else {
                  spouseShareFrac = hasChildren ? 1 / 4 : 1 / 2;
                  spouseLabel = hasChildren ? "الزوج (1/4)" : "الزوج (1/2)";
                }
              }
              const spouseAmount = estateAmount * spouseShareFrac;
              const fatherAmount = hasFather ? estateAmount * (hasChildren ? 1 / 6 : 1 / 6) : 0;
              const motherAmount = hasMother ? estateAmount * (hasChildren ? 1 / 6 : 1 / 3) : 0;
              const remainderAfterFixed = Math.max(0, estateAmount - spouseAmount - (hasFather ? fatherAmount : 0) - (hasMother ? motherAmount : 0));
              const totalParts = (sonsCount * 2) + daughtersCount;
              const perSonAmount = totalParts > 0 ? (remainderAfterFixed * 2) / totalParts : 0;
              const perDaughterAmount = totalParts > 0 ? (remainderAfterFixed * 1) / totalParts : 0;
              return (
                <div className="p-5 rounded-2xl bg-[#F5F2EE] border border-[#E6E0D8] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E6E0D8] pb-3">
                    <span className="text-xs font-bold text-[#4A5D4E]">تفصيل الحصص الشرعية:</span>
                    <span className="text-xs font-bold text-[#2D241E] font-mono">{estateAmount.toLocaleString()} إجمالي</span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    {hasSpouse && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E6E0D8]/70">
                        <span>{spouseLabel}</span>
                        <span className="font-bold text-[#2D4232]">{Math.round(spouseAmount).toLocaleString()}</span>
                      </div>
                    )}
                    {hasFather && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E6E0D8]/70">
                        <span>الأب (السدس 1/6)</span>
                        <span className="font-bold text-[#2D4232]">{Math.round(fatherAmount).toLocaleString()}</span>
                      </div>
                    )}
                    {hasMother && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E6E0D8]/70">
                        <span>الأم (السدس 1/6)</span>
                        <span className="font-bold text-[#2D4232]">{Math.round(motherAmount).toLocaleString()}</span>
                      </div>
                    )}
                    {sonsCount > 0 && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E6E0D8]/70">
                        <span>الأبناء ({sonsCount} × 2)</span>
                        <span className="font-bold text-[#2D4232]">{Math.round(perSonAmount * sonsCount).toLocaleString()}</span>
                      </div>
                    )}
                    {daughtersCount > 0 && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E6E0D8]/70">
                        <span>البنات ({daughtersCount} × 1)</span>
                        <span className="font-bold text-[#2D4232]">{Math.round(perDaughterAmount * daughtersCount).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-[#D4E2D5]/40 border border-[#B8CEBA] text-[11px] text-[#2D4232] leading-relaxed">
                    تنبيه: حساب تقريبي للطبقة الأولى فقط. يُنصح بمراجعة مكتب المرجع الشرعي.
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {activeSection === "khums" && (
        <div className="rounded-[32px] bg-white border border-[#E6E0D8] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E6E0D8] pb-5">
            <h3 className="text-xl font-bold text-[#2D241E] flex items-center gap-2 font-serif">
              <Scale className="w-5 h-5 text-[#4A5D4E]" />
              حاسبة الخمس ورأس السنة الخمسية
            </h3>
            <p className="text-xs text-[#8C7E6E] mt-1">
              احتساب خمس أرباح المكاسب والفوائض السنوية (20%)
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2D241E] mb-1">1. الأموال النقدية والمدخرات:</label>
                <input type="text" inputMode="numeric" value={cashSavings === 0 ? "" : toNumeral(cashSavings, numeral)} onChange={(e) => setCashSavings(Math.max(0, parseNumeral(e.target.value)))} className="w-full px-4 py-2.5 rounded-2xl bg-[#F1EFEC] border border-[#E6E0D8] text-xs font-bold text-[#2D241E] focus:outline-none focus:border-[#4A5D4E]" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2D241E] mb-1">2. قيمة المؤونة والبضائع الفائضة:</label>
                <input type="text" inputMode="numeric" value={surplusGoods === 0 ? "" : toNumeral(surplusGoods, numeral)} onChange={(e) => setSurplusGoods(Math.max(0, parseNumeral(e.target.value)))} className="w-full px-4 py-2.5 rounded-2xl bg-[#F1EFEC] border border-[#E6E0D8] text-xs font-bold text-[#2D241E] focus:outline-none focus:border-[#4A5D4E]" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2D241E] mb-1">3. ديون مؤونة واجبة السداد:</label>
                <input type="text" inputMode="numeric" value={immediateDebts === 0 ? "" : toNumeral(immediateDebts, numeral)} onChange={(e) => setImmediateDebts(Math.max(0, parseNumeral(e.target.value)))} className="w-full px-4 py-2.5 rounded-2xl bg-[#F1EFEC] border border-[#E6E0D8] text-xs font-bold text-[#2D241E] focus:outline-none focus:border-[#4A5D4E]" placeholder="0" />
              </div>
            </div>
            {(() => {
              const netSurplus = Math.max(0, cashSavings + surplusGoods - immediateDebts);
              const totalKhums = netSurplus * 0.20;
              const imamShare = totalKhums / 2;
              const sadatShare = totalKhums / 2;
              return (
                <div className="p-6 rounded-2xl bg-[#F5F2EE] border border-[#E6E0D8] flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-[#4A5D4E]">نتيجة الحساب الخُمسي:</div>
                    <div className="p-3.5 rounded-xl bg-white border border-[#E6E0D8] flex items-center justify-between text-xs">
                      <span>صافي الفائض:</span>
                      <span className="font-bold text-[#2D241E]">{Math.round(netSurplus).toLocaleString()}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#4A5D4E] text-white flex items-center justify-between shadow-sm">
                      <span className="text-xs font-bold">الخمس الواجب (20%):</span>
                      <span className="text-lg font-bold font-serif">{Math.round(totalKhums).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-white border border-[#E6E0D8] text-center">
                        <span className="text-[10px] text-[#8C7E6E] block">سهم الإمام (عج):</span>
                        <span className="text-xs font-bold text-[#2D4232]">{Math.round(imamShare).toLocaleString()}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-[#E6E0D8] text-center">
                        <span className="text-[10px] text-[#8C7E6E] block">سهم السادة:</span>
                        <span className="text-xs font-bold text-[#2D4232]">{Math.round(sadatShare).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#8C7E6E] leading-relaxed">
                    «وَاعْلَمُوا أَنَّمَا غَنِمْتُم مِّن شَيْءٍ فَأَنَّ لِلَّهِ خُمُسَهُ» (الأنفال: 41)
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculatorsView;
