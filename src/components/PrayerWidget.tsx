import React, { useState, useEffect } from "react";
import {
  getCoordinates,
  getNextPrayerAmongThree,
  getHijriDate,
  getGregorianDate,
  formatCountdown,
  formatTime,
  NextPrayer,
  PrayerTimes,
  Coordinates,
} from "../lib/prayerTimes";
import { toNumeral, getNumeralSystem, NumeralSystem } from "../lib/numerals";
import {
  AZAN_SOUNDS,
  AzanSound,
  getAzanSettings,
  saveAzanSettings,
  scheduleAzanAlarms,
  cancelAzanAlarms,
  playAzanPreview,
  stopAzanPreview,
} from "../lib/azan";
import { Clock, Volume2, VolumeX, Bell, BellOff, Check } from "lucide-react";

function convertDigits(str: string, system: NumeralSystem): string {
  if (system === "western") return str;
  return str.replace(/[0-9]/g, (d) => toNumeral(parseInt(d), system));
}

export const PrayerWidget: React.FC = () => {
  const [now, setNow] = useState<Date>(new Date());
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [next, setNext] = useState<NextPrayer | null>(null);
  const [today, setToday] = useState<PrayerTimes | null>(null);
  const [hijri, setHijri] = useState<string>("");
  const [gregorian, setGregorian] = useState<string>("");
  const [numeral, setNumeral] = useState<NumeralSystem>("western");

  const [azanEnabled, setAzanEnabled] = useState<boolean>(false);
  const [azanIndex, setAzanIndex] = useState<number>(0);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [azanSaved, setAzanSaved] = useState<boolean>(false);

  useEffect(() => {
    getCoordinates().then(setCoords);
    setNumeral(getNumeralSystem());
    const settings = getAzanSettings();
    setAzanEnabled(settings.enabled);
    setAzanIndex(settings.azanIndex);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!coords) return;
    const tzOffset = -new Date().getTimezoneOffset() / 60;
    const { next: n, today: t } = getNextPrayerAmongThree(
      coords.latitude,
      coords.longitude,
      tzOffset,
      now
    );
    setNext(n);
    setToday(t);
  }, [coords, now]);

  useEffect(() => {
    setHijri(getHijriDate(now));
    setGregorian(getGregorianDate(now));
  }, [now]);

  useEffect(() => {
    return () => stopAzanPreview();
  }, []);

  const applyAzanSettings = async (enabled: boolean, index: number) => {
    const settings = { enabled, azanIndex: index };
    saveAzanSettings(settings);
    if (coords) {
      await scheduleAzanAlarms(coords.latitude, coords.longitude, -new Date().getTimezoneOffset() / 60);
    } else {
      await cancelAzanAlarms();
    }
  };

  const toggleAzan = async () => {
    stopAzanPreview();
    setPreviewingId(null);
    const nextEnabled = !azanEnabled;
    setAzanEnabled(nextEnabled);
    setAzanSaved(true);
    setTimeout(() => setAzanSaved(false), 2500);
    await applyAzanSettings(nextEnabled, azanIndex);
  };

  const selectAzan = async (index: number) => {
    stopAzanPreview();
    setPreviewingId(null);
    setAzanIndex(index);
    setAzanSaved(true);
    setTimeout(() => setAzanSaved(false), 2500);
    await applyAzanSettings(azanEnabled, index);
  };

  const togglePreview = (sound: AzanSound) => {
    if (previewingId === sound.id) {
      stopAzanPreview();
      setPreviewingId(null);
    } else {
      playAzanPreview(sound);
      setPreviewingId(sound.id);
    }
  };

  if (!coords || !next || !today) {
    return (
      <div className="mt-6 rounded-2xl bg-white/10 border border-white/20 p-5 text-center text-sm text-[#D4E2D5]">
        جاري حساب مواقيت الصلاة...
      </div>
    );
  }

  const timeRow: { name: string; time: Date }[] = [
    { name: "الفجر", time: today.fajr },
    { name: "الظهر", time: today.dhuhr },
    { name: "المغرب", time: today.maghrib },
  ];

  const currentSound = AZAN_SOUNDS[azanIndex];

  return (
    <div className="mt-8 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md p-5 sm:p-6 text-white text-right">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xl sm:text-2xl font-bold font-serif">{hijri}</div>
          <div className="text-sm text-[#D4E2D5]">{gregorian}</div>
        </div>
        <span className="shrink-0 w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
          <Clock className="w-5 h-5" />
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-[#D4E2D5]">المتبقي لصلاة {next.name}</div>
          <div className="text-3xl sm:text-4xl font-bold tabular-nums leading-tight" dir="ltr">
            {convertDigits(formatCountdown(next.remainingMs), numeral)}
          </div>
        </div>
        <div className="text-left">
          <div className="text-xs text-[#D4E2D5]">موعدها</div>
          <div className="text-2xl font-bold">{convertDigits(formatTime(next.time), numeral)}</div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/15 grid grid-cols-3 gap-1 text-center">
        {timeRow.map((p) => (
          <div key={p.name} className="space-y-0.5">
            <div className="text-[11px] text-[#D4E2D5]">{p.name}</div>
            <div className="text-sm font-bold">{convertDigits(formatTime(p.time), numeral)}</div>
          </div>
        ))}
      </div>

      {/* Azan alarm settings */}
      <div className="mt-5 pt-4 border-t border-white/15 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {azanEnabled ? <Bell className="w-5 h-5 text-[#D4E2D5]" /> : <BellOff className="w-5 h-5 text-[#D4E2D5]" />}
            <div className="text-right">
              <div className="text-sm font-bold">منبه الأذان</div>
              <div className="text-[11px] text-[#D4E2D5]">رنين الأذان في أوقات الصلاة فوق التطبيقات وعند قفل الشاشة</div>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleAzan}
            aria-label={azanEnabled ? "إيقاف منبه الأذان" : "تفعيل منبه الأذان"}
            className={`relative shrink-0 w-14 h-8 rounded-full transition-colors cursor-pointer ${azanEnabled ? "bg-[#4A5D4E]" : "bg-white/20"}`}
          >
            <span
              className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${azanEnabled ? "left-7" : "left-1"}`}
            />
          </button>
        </div>

        {azanEnabled && (
          <>
            <div className="grid grid-cols-1 gap-2 pt-1">
              {AZAN_SOUNDS.map((sound, index) => {
                const selected = index === azanIndex;
                const previewing = previewingId === sound.id;
                return (
                  <div
                    key={sound.id}
                    className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border transition-colors ${
                      selected ? "bg-white/20 border-white/40" : "bg-white/5 border-white/15"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => selectAzan(index)}
                      className="flex items-center gap-2 text-right flex-1 cursor-pointer"
                    >
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selected ? "border-white bg-white" : "border-white/40"
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5 text-[#4A5D4E]" />}
                      </span>
                      <span className={`text-sm font-bold ${selected ? "text-white" : "text-[#D4E2D5]"}`}>
                        {sound.label}
                      </span>
                      {selected && (
                        <span className="text-[10px] text-white/70 bg-white/10 px-1.5 py-0.5 rounded-md">المحدد</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePreview(sound)}
                      aria-label={previewing ? `إيقاف ${sound.label}` : `الاستماع إلى ${sound.label}`}
                      className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                        previewing ? "bg-white text-[#4A5D4E]" : "bg-white/15 text-white hover:bg-white/25"
                      }`}
                    >
                      {previewing ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-[#D4E2D5] leading-relaxed">
              استمع للأذان أولاً ثم اختر النوع، وسيرنّ الأذان تلقائياً عند كل صلاة حتى وإن كان الجهاز مقفلاً.
            </p>
          </>
        )}

        {azanSaved && (
          <div className="text-center text-xs text-[#D4E2D5] bg-white/10 rounded-xl py-2">
            تم حفظ إعدادات منبه الأذان
          </div>
        )}

        {azanEnabled && currentSound && (
          <div className="text-[11px] text-[#D4E2D5]">
            النوع المختار: {currentSound.label}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrayerWidget;
