import React, { useState } from "react";
import { haptic } from "../lib/haptics";
import {
  getNumeralSystem,
  setNumeralSystem,
  NUMERAL_LABELS,
  NumeralSystem,
} from "../lib/numerals";
import {
  Settings, Info, ShieldCheck, Hash, MapPin, Type, Moon, Sun,
  Bell, BellOff, Download, Upload, Trash2, Share2, RefreshCw,
  Vibrate, Type as TypeIcon, ChevronDown, ChevronUp,
} from "lucide-react";
import { Share } from "@capacitor/share";
import {
  getCachedCoords,
  cacheCoords,
  Coordinates,
} from "../lib/prayerTimes";
import { FONTS, getSelectedFont, setSelectedFont, FontOption } from "../lib/fonts";
import {
  getSettings, setDarkMode, setHapticEnabled,
  setNotificationsEnabled, setPrayerNotifications, setCommunityNotifications,
  setFontSize,
} from "../lib/appSettings";
import { checkForUpdate } from "../lib/updateChecker";

interface SettingsViewProps {
  showFeedback: (msg: string) => void;
}

const NUMERAL_OPTIONS: { key: NumeralSystem; sample: string }[] = [
  { key: "western", sample: "123" },
  { key: "arabic", sample: "١٢٣" },
  { key: "indian", sample: "१२३" },
  { key: "persian", sample: "۱۲۳" },
];

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${checked ? "bg-[#4A5D4E]" : "bg-[#E6E0D8]"}`}
  >
    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "right-0.5" : "left-0.5"}`} />
  </button>
);

export const SettingsView: React.FC<SettingsViewProps> = ({ showFeedback }) => {
  const [numeral, setNumeral] = useState<NumeralSystem>(getNumeralSystem);
  const [coords, setCoords] = useState<Coordinates | null>(getCachedCoords);
  const [locating, setLocating] = useState(false);
  const [selectedFont, setSelectedFontState] = useState<string>(getSelectedFont);
  const [settings, setSettings] = useState(getSettings());
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const changeNumeral = (sys: NumeralSystem) => {
    setNumeral(sys);
    setNumeralSystem(sys);
    haptic.light();
    showFeedback(`تم تغيير الأرقام إلى ${NUMERAL_LABELS[sys]}`);
  };

  const changeFont = (font: FontOption) => {
    setSelectedFontState(font.id);
    setSelectedFont(font.id);
    document.documentElement.style.setProperty("--app-font", font.family.split(",")[0].trim());
    haptic.light();
    showFeedback(`تم تغيير الخط إلى ${font.name}`);
  };

  const updateSetting = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    haptic.light();
  };

  const applyDarkMode = (dark: boolean) => {
    updateSetting("darkMode", dark);
    setDarkMode(dark);
    document.documentElement.classList.toggle("dark", dark);
  };

  const applyHaptic = (v: boolean) => {
    updateSetting("hapticEnabled", v);
    setHapticEnabled(v);
  };

  const applyNotifications = (v: boolean) => {
    updateSetting("notificationsEnabled", v);
    setNotificationsEnabled(v);
  };

  const applyPrayerNotifications = (v: boolean) => {
    updateSetting("prayerNotifications", v);
    setPrayerNotifications(v);
  };

  const applyCommunityNotifications = (v: boolean) => {
    updateSetting("communityNotifications", v);
    setCommunityNotifications(v);
  };

  const applyFontSize = (v: number) => {
    updateSetting("fontSize", v);
    setFontSize(v);
    document.documentElement.style.setProperty("--app-font-size", `${v}px`);
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      showFeedback("جهازك لا يدعم تحديد الموقع");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        cacheCoords(c);
        setCoords(c);
        setLocating(false);
        haptic.light();
        showFeedback("تم تحديث الموقع بنجاح");
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          showFeedback("تم رفض صلاحية الموقع — افتح الإعدادات وسمح بالموقع للتطبيق");
        } else if (err.code === 2) {
          showFeedback("تعذر تحديد الموقع — تأكد من تفعيل GPS");
        } else if (err.code === 3) {
          showFeedback("انتهت مهلة تحديد الموقع — حاول مرة أخرى");
        } else {
          showFeedback("تعذر تحديد الموقع");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    haptic.light();
    try {
      const info = await checkForUpdate();
      if (info) {
        showFeedback(`يوجد تحديث جديد: الإصدار ${info.version}`);
      } else {
        showFeedback("لا يوجد تحديثات متاحة — أنت تستخدم أحدث إصدار");
      }
    } catch {
      showFeedback("تعذر التحقق من التحديث");
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleBackup = () => {
    const data: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("rwafed_")) {
        data[key] = localStorage.getItem(key);
      }
    }
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rwafed-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    haptic.success();
    showFeedback("تم تصدير البيانات بنجاح");
  };

  const handleRestore = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          Object.entries(data).forEach(([key, value]) => {
            localStorage.setItem(key, value as string);
          });
          haptic.success();
          showFeedback("تم استيراد البيانات بنجاح — أعد تشغيل التطبيق");
        } catch {
          showFeedback("ملف غير صالح");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClearCache = () => {
    if (confirm("هل أنت متأكد من مسح جميع البيانات المحفوظة؟")) {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("rwafed_")) keys.push(key);
      }
      keys.forEach((k) => localStorage.removeItem(k));
      haptic.success();
      showFeedback("تم مسح البيانات بنجاح — أعد تشغيل التطبيق");
    }
  };

  const handleShare = async () => {
    const apkUrl = "https://github.com/baraniq/rwafed-app/releases/download/v1.2.0/rwafed-v1.2.0.apk";
    try {
      await Share.share({
        title: "تطبيق روافد",
        text: "تطبيق روافد — رفيقك الإسلامي اليومي. القرآن الكريم، الأدعية، الاستخارة، والكثير.",
        url: apkUrl,
        dialogTitle: "مشاركة التطبيق",
      });
    } catch {
      try {
        if (navigator.share) {
          await navigator.share({
            title: "تطبيق روافد",
            text: "تطبيق روافد — رفيقك الإسلامي اليومي.",
            url: apkUrl,
          });
        } else {
          await navigator.clipboard.writeText(apkUrl);
          showFeedback("تم نسخ رابط التحميل");
        }
      } catch {
        try { await navigator.clipboard.writeText(apkUrl); } catch {}
        showFeedback("تم نسخ رابط التحميل");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      {/* Header */}
      <div className="rounded-[32px] bg-white border border-[#E6E0D8] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-[#F1EFEC] text-[#4A5D4E] flex items-center justify-center font-bold">
            <Settings className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-[#2D241E] font-serif">الإعدادات</h2>
            <p className="text-xs text-[#8C7E6E]">تخصيص التطبيق</p>
          </div>
        </div>
      </div>

      {/* المظهر */}
      <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-5 shadow-xs space-y-3">
        <button type="button" onClick={() => toggleSection("appearance")} className="w-full flex items-center justify-between cursor-pointer">
          <h3 className="text-sm font-bold text-[#2D241E] flex items-center gap-2">
            {settings.darkMode ? <Moon className="w-4 h-4 text-[#4A5D4E]" /> : <Sun className="w-4 h-4 text-[#4A5D4E]" />} المظهر
          </h3>
          {expandedSections.appearance ? <ChevronUp className="w-4 h-4 text-[#8C7E6E]" /> : <ChevronDown className="w-4 h-4 text-[#8C7E6E]" />}
        </button>
        {expandedSections.appearance && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#2D241E]">الوضع الداكن</span>
              <Toggle checked={settings.darkMode} onChange={applyDarkMode} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#2D241E]">حجم الخط</span>
                <span className="text-xs text-[#4A5D4E] font-bold">{settings.fontSize}px</span>
              </div>
              <input type="range" min="12" max="24" value={settings.fontSize} onChange={(e) => applyFontSize(parseInt(e.target.value))} className="w-full h-2 rounded-full bg-[#E6E0D8] appearance-none cursor-pointer accent-[#4A5D4E]" />
            </div>
          </div>
        )}
      </div>

      {/* الإشعارات */}
      <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-5 shadow-xs space-y-3">
        <button type="button" onClick={() => toggleSection("notifications")} className="w-full flex items-center justify-between cursor-pointer">
          <h3 className="text-sm font-bold text-[#2D241E] flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#4A5D4E]" /> الإشعارات
          </h3>
          {expandedSections.notifications ? <ChevronUp className="w-4 h-4 text-[#8C7E6E]" /> : <ChevronDown className="w-4 h-4 text-[#8C7E6E]" />}
        </button>
        {expandedSections.notifications && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#2D241E]">تفعيل الإشعارات</span>
              <Toggle checked={settings.notificationsEnabled} onChange={applyNotifications} />
            </div>
            {settings.notificationsEnabled && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#2D241E]">إشعارات مواقيت الصلاة</span>
                  <Toggle checked={settings.prayerNotifications} onChange={applyPrayerNotifications} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#2D241E]">إشعارات المجتمع</span>
                  <Toggle checked={settings.communityNotifications} onChange={applyCommunityNotifications} />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* الاهتزاز */}
      <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#2D241E] flex items-center gap-2">
            <Vibrate className="w-4 h-4 text-[#4A5D4E]" /> الاهتزاز
          </h3>
          <Toggle checked={settings.hapticEnabled} onChange={applyHaptic} />
        </div>
      </div>

      {/* نظام الأرقام */}
      <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-[#2D241E] flex items-center gap-2">
          <Hash className="w-4 h-4 text-[#4A5D4E]" /> نظام الأرقام
        </h3>
        <p className="text-xs text-[#8C7E6E]">
          اختر شكل الأرقام المعروضة في التطبيق: العدادات، المواقيت، التسبيح، وسجل القضاء.
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {NUMERAL_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => changeNumeral(opt.key)}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all cursor-pointer ${
                numeral === opt.key
                  ? "bg-[#4A5D4E] border-[#4A5D4E] text-white"
                  : "bg-white border-[#E6E0D8] text-[#8C7E6E] hover:text-[#2D241E]"
              }`}
            >
              <span className="text-sm font-bold">{NUMERAL_LABELS[opt.key]}</span>
              <span className="font-mono text-lg font-extrabold">{opt.sample}</span>
            </button>
          ))}
        </div>
      </div>

      {/* نوع الخط */}
      <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-[#2D241E] flex items-center gap-2">
          <Type className="w-4 h-4 text-[#4A5D4E]" /> نوع الخط
        </h3>
        <p className="text-xs text-[#8C7E6E]">
          اختر الخط المناسب للعرض في جميع أقسام التطبيق.
        </p>
        <div className="space-y-2 pt-1">
          {FONTS.map((font) => (
            <button
              key={font.id}
              type="button"
              onClick={() => changeFont(font)}
              className={`w-full text-right p-3 rounded-2xl border transition-all cursor-pointer ${
                selectedFont === font.id
                  ? "bg-[#4A5D4E] border-[#4A5D4E] text-white"
                  : "bg-white border-[#E6E0D8] text-[#8C7E6E] hover:text-[#2D241E]"
              }`}
            >
              <span className="text-sm font-bold" style={{ fontFamily: font.family }}>
                {font.name}
              </span>
              <span className="block text-[11px] mt-1 opacity-70" style={{ fontFamily: font.family }}>
                بسم الله الرحمن الرحيم
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* تحديد الموقع */}
      <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-[#2D241E] flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#4A5D4E]" /> تحديد الموقع
        </h3>
        <p className="text-xs text-[#8C7E6E]">
          حدد موقعك لحساب مواقيت الصلاة بدقة.
        </p>
        {coords && (
          <div className="text-xs text-[#8C7E6E] bg-[#F9F7F4] rounded-xl px-3 py-2 font-mono">
            خط العرض: {coords.latitude.toFixed(4)} — خط الطول: {coords.longitude.toFixed(4)}
          </div>
        )}
        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-[#4A5D4E] bg-[#4A5D4E] text-white text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
        >
          <MapPin className="w-4 h-4" />
          {locating ? "جارٍ التحديد..." : "تحديد موقعي الحالي"}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-[#8C7E6E] block mb-1">خط العرض</label>
            <input
              type="number"
              step="any"
              value={coords?.latitude ?? ""}
              onChange={(e) => {
                const lat = parseFloat(e.target.value);
                if (!isNaN(lat)) {
                  const c: Coordinates = { latitude: lat, longitude: coords?.longitude ?? 0 };
                  cacheCoords(c);
                  setCoords(c);
                }
              }}
              placeholder="33.3128"
              className="w-full px-3 py-2 rounded-xl border border-[#E6E0D8] text-sm text-[#2D241E] bg-white outline-none focus:border-[#4A5D4E] transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#8C7E6E] block mb-1">خط الطول</label>
            <input
              type="number"
              step="any"
              value={coords?.longitude ?? ""}
              onChange={(e) => {
                const lng = parseFloat(e.target.value);
                if (!isNaN(lng)) {
                  const c: Coordinates = { latitude: coords?.latitude ?? 0, longitude: lng };
                  cacheCoords(c);
                  setCoords(c);
                }
              }}
              placeholder="44.3615"
              className="w-full px-3 py-2 rounded-xl border border-[#E6E0D8] text-sm text-[#2D241E] bg-white outline-none focus:border-[#4A5D4E] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* النسخ الاحتياطي */}
      <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-[#2D241E] flex items-center gap-2">
          <Download className="w-4 h-4 text-[#4A5D4E]" /> النسخ الاحتياطي
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={handleBackup} className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#4A5D4E] text-white text-sm font-bold cursor-pointer hover:bg-[#3d4d40] transition-colors">
            <Download className="w-4 h-4" /> تصدير
          </button>
          <button type="button" onClick={handleRestore} className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#F1EFEC] text-[#4A5D4E] text-sm font-bold cursor-pointer hover:bg-[#E6E0D8] transition-colors">
            <Upload className="w-4 h-4" /> استيراد
          </button>
        </div>
        <button type="button" onClick={handleClearCache} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-sm font-bold cursor-pointer hover:bg-red-100 transition-colors">
          <Trash2 className="w-4 h-4" /> مسح البيانات المحفوظة
        </button>
      </div>

      {/* مشاركة وتحديث */}
      <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-5 shadow-xs space-y-3">
        <button type="button" onClick={handleShare} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#F1EFEC] text-[#4A5D4E] text-sm font-bold cursor-pointer hover:bg-[#E6E0D8] transition-colors">
          <Share2 className="w-4 h-4" /> مشاركة التطبيق
        </button>
        <button type="button" onClick={handleCheckUpdate} disabled={checkingUpdate} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#F1EFEC] text-[#4A5D4E] text-sm font-bold cursor-pointer hover:bg-[#E6E0D8] transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${checkingUpdate ? "animate-spin" : ""}`} />
          {checkingUpdate ? "جارٍ التحقق..." : "التحقق من التحديث"}
        </button>
      </div>

      {/* حول التطبيق */}
      <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-[#2D241E] flex items-center gap-2">
          <Info className="w-4 h-4 text-[#4A5D4E]" /> حول التطبيق
        </h3>
        <p className="text-xs text-[#8C7E6E] leading-relaxed">
          تطبيق روافد — رفيقك الإسلامي اليومي. القرآن الكريم، الأدعية والزيارات، الاستخارة، الختمات الجماعية، الحاسبات الفقهية، ومواقيت الصلاة.
        </p>
        <p className="text-xs text-[#8C7E6E]">الإصدار 1.1.0</p>
      </div>

      {/* الخصوصية */}
      <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-[#2D241E] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#4A5D4E]" /> الخصوصية
        </h3>
        <p className="text-xs text-[#8C7E6E] leading-relaxed">
          تُحفظ بياناتك محلياً على جهازك (العلامات، الملاحظات، أعمال اليوم). بيانات المجتمع (الختمات والأدعية) تُخزن في قاعدة بيانات آمنة.
        </p>
      </div>
    </div>
  );
};

export default SettingsView;
