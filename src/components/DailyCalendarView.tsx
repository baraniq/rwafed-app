import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Sparkles,
  BookOpen,
  Sun,
  Moon,
  Shield,
  HandCoins,
  Scale,
  Plane,
  HeartHandshake,
  Shirt,
  Scissors,
  Fingerprint,
  Landmark,
  ScrollText,
  Info,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { toNumeral, getNumeralSystem, NumeralSystem } from "../lib/numerals";
import {
  subscribeTodayCalendar,
  todayKey,
  getPhoneHijri,
  DailyCalendarEntry,
} from "../lib/dailyCalendar";

function verdictStyle(text: string): { badge: string; dot: string } {
  const lower = text.toLowerCase();
  const bad = ["غير جيد", "لا يصح", "لا يصلح", "يُكره", "لا تصح", "غير جيدة", "لا تفعل", "لا تُقدم"];
  const good = ["جيد", "مناسب", "مستحب", "يصلح", "يصح", "جيدة", "ممتاز"];
  if (bad.some((p) => lower.includes(p))) return { badge: "bg-rose-100 text-rose-700", dot: "bg-rose-500" };
  if (good.some((p) => lower.includes(p))) return { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" };
  return { badge: "bg-[#F1EFEC] text-[#8C7E6E]", dot: "bg-[#8C7E6E]" };
}

export const DailyCalendarView: React.FC = () => {
  const [today, setToday] = useState<DailyCalendarEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [numeral, setNumeral] = useState<NumeralSystem>("western");

  useEffect(() => {
    setNumeral(getNumeralSystem());
    setLoading(true);
    const unsub = subscribeTodayCalendar((entry) => {
      setToday(entry);
      setLoading(false);
    });
    return () => unsub();
  }, [todayKey()]);

  const section = (icon: React.ReactNode, title: string, text: string, verdict?: boolean) => {
    if (!text) return null;
    return (
      <div className="rounded-2xl bg-white border border-[#E6E0D8] p-4 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#F1EFEC] text-[#4A5D4E] flex items-center justify-center shrink-0">
            {icon}
          </span>
          <h4 className="text-sm font-bold text-[#4A5D4E] font-serif">{title}</h4>
        </div>
        <p className="text-sm text-black leading-relaxed font-serif">{text}</p>
      </div>
    );
  };

  const actionSection = (icon: React.ReactNode, title: string, text: string) => {
    if (!text) return null;
    const vs = verdictStyle(text);
    return (
      <div className="rounded-2xl bg-white border border-[#E6E0D8] p-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-[#F1EFEC] text-[#4A5D4E] flex items-center justify-center shrink-0">
            {icon}
          </span>
          <h4 className="text-sm font-bold text-black font-serif">{title}</h4>
        </div>
        <div className="flex items-center gap-2 text-left">
          <span className="text-xs text-black leading-relaxed text-right">{text}</span>
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${vs.dot}`} />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16 text-sm text-[#8C7E6E]">جاري تحميل تقويم اليوم...</div>
    );
  }

  if (!today) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16 space-y-3">
        <span className="mx-auto w-14 h-14 rounded-2xl bg-[#F1EFEC] text-[#8C7E6E] flex items-center justify-center">
          <Clock className="w-7 h-7" />
        </span>
        <h3 className="text-lg font-bold text-black font-serif">لا يوجد تقويم منشور بعد</h3>
        <p className="text-sm text-[#8C7E6E] max-w-md mx-auto leading-relaxed">
          لم يُنشر بعد تقويم يطابق تاريخ اليوم الهجري في هاتفك. سيظهر التقويم فور نشره على القناة، دون الحاجة لإعادة تثبيت التطبيق.
        </p>
        <p className="text-xs text-[#8C7E6E] max-w-md mx-auto leading-relaxed">
          يرجى مراسلة صاحب التقويم على تيليجرام للاستفسار أو الإبلاغ عن أي خلل:
        </p>
        <a
          href="https://t.me/baran_iq"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#4A5D4E] text-white text-sm font-bold hover:bg-[#3d4d40] transition-colors"
        >
          @baran_iq
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#4A5D4E] to-[#3d4d40] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">
              <CalendarDays className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif">تقويم يوم {today.weekday}</h2>
              <p className="text-sm text-[#D4E2D5]">{today.gregorian} • {getPhoneHijri()}</p>
            </div>
          </div>
          <span className="px-4 py-2 rounded-full bg-white/15 text-xs font-bold">صدقة اليوم</span>
        </div>
      </div>

      {today.events && (
        <div className="rounded-2xl bg-[#FFE5D9] border border-[#FFD0BD] p-4 text-[#8C4E3E] text-sm font-serif leading-relaxed flex items-start gap-2">
          <Landmark className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{today.events}</span>
        </div>
      )}

      {today.warning && (
        <div className="rounded-2xl bg-rose-50 border-2 border-rose-300 p-4 text-rose-900 text-sm font-serif leading-relaxed flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-rose-600" />
          <span>{today.warning}</span>
        </div>
      )}

      <div className="space-y-4">
        {section(<ScrollText className="w-4 h-4" />, "من نفحات زيارة عاشوراء", today.nufahat)}
        {section(<Sparkles className="w-4 h-4" />, "من فضائل أمير المؤمنين (ع)", today.fadael)}
        {section(<Info className="w-4 h-4" />, "حكمة اليوم", today.hikma)}
        {section(<Moon className="w-4 h-4" />, "من سيرة الإمام المنتظر (عج)", today.sira)}
        {section(<BookOpen className="w-4 h-4" />, "زيارة اليوم", today.ziyara)}
        {section(<Sun className="w-4 h-4" />, `دعاء يوم ${today.weekday}`, today.dua)}
        {section(<Shield className="w-4 h-4" />, `تعويذة يوم ${today.weekday}`, today.taweezh)}
        {section(<Sparkles className="w-4 h-4" />, "ذكر اليوم", today.dhikr)}
        {section(<ScrollText className="w-4 h-4" />, "الاستغفار اليومي المعتبر", today.istighfar)}
        {section(<BookOpen className="w-4 h-4" />, "أذكار عامة", today.adhkar)}
        {section(<BookOpen className="w-4 h-4" />, "الورد القرآني", today.wird)}
        {section(<HandCoins className="w-4 h-4" />, "صدقة اليوم", today.sadaqa)}
        {section(<Scale className="w-4 h-4" />, "تنبيهات فقهية", today.fiqh)}
      </div>

      {/* Actions verdicts */}
      <div className="rounded-[28px] bg-white border border-[#E6E0D8] p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-black flex items-center gap-2 font-serif">
          <CalendarDays className="w-4 h-4 text-[#4A5D4E]" /> أعمال اليوم وتوجيهاتها
        </h3>
        <div className="space-y-2.5">
          {actionSection(<Plane className="w-4 h-4" />, "السفر", today.travel)}
          {actionSection(<HeartHandshake className="w-4 h-4" />, "المقاربة الزوجية", today.marital)}
          {actionSection(<Shirt className="w-4 h-4" />, "اقتناء الملابس", today.clothes)}
          {actionSection(<Scissors className="w-4 h-4" />, "إصلاح الشعر", today.hair)}
          {actionSection(<Fingerprint className="w-4 h-4" />, "تقليم الأظافر", today.nails)}
        </div>
      </div>

      <div className="rounded-2xl bg-[#F1EFEC] border border-[#E6E0D8] p-4">
        <p className="text-xs text-[#8C7E6E] leading-relaxed text-center">
          ما يرد في هذا التقويم من أعمال وأذكار ومستحبات، يُؤتى بها بنية (رجاء المطلوبية) استناداً إلى قاعدة التسامح في أدلة السنن.
        </p>
      </div>
    </div>
  );
};

export default DailyCalendarView;
