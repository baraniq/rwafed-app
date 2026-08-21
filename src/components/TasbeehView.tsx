import React, { useState, useEffect, useRef, useCallback } from "react";
import { haptic } from "../lib/haptics";
import { getTasbeeh, saveTasbeeh } from "../lib/storage";
import { toNumeral, getNumeralSystem, NumeralSystem } from "../lib/numerals";
import AppButton from "./AppButton";
import {
  RotateCcw,
  Plus,
  Minus,
  Volume2,
  VolumeX,
  Vibrate,
  VibrateOff,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface TasbeehViewProps {
  showFeedback: (msg: string) => void;
}

type Mode = "open" | "zahra";

const ZAHRA_STAGES = [
  { dhikr: "اللَّهُ أَكْبَرُ", target: 34 },
  { dhikr: "الْحَمْدُ لِلَّهِ", target: 33 },
  { dhikr: "سُبْحَانَ اللَّهِ", target: 33 },
];

const OPEN_DHIKRS = [
  { label: "سُبْحَانَ اللَّهِ", target: 33 },
  { label: "الْحَمْدُ لِلَّهِ", target: 33 },
  { label: "اللَّهُ أَكْبَرُ", target: 34 },
  { label: "لَا إِلٰهَ إِلَّا اللَّهُ", target: 100 },
  { label: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ", target: 70 },
  { label: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ", target: 100 },
];

const CLOSING_DUA =
  "اللَّهُمَّ تَقَبَّلْ مِنَّا هَذَا الذِّكْرَ، وَارْفَعْ دَرَجَاتِنَا بِهِ، وَاجْعَلْهُ نُورًا فِي قُلُوبِنَا، وَذُخْرًا يَوْمَ لِقَائِكَ، بِحَقِّ مُحَمَّدٍ وَآلِهِ الطَّاهِرِينَ.";

const BEAD_COLOR = "#8C5E3C";
const RING_R = 96;
const BEAD_SIZE = 10;

export const TasbeehView: React.FC<TasbeehViewProps> = ({ showFeedback }) => {
  const [mode, setMode] = useState<Mode>("open");
  const [openDhikr, setOpenDhikr] = useState<string>(OPEN_DHIKRS[0].label);
  const [openTarget, setOpenTarget] = useState<number>(33);
  const [count, setCount] = useState<number>(0);
  const [vibration, setVibration] = useState<boolean>(true);
  const [sound, setSound] = useState<boolean>(true);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const [zahraDone, setZahraDone] = useState<boolean[]>([false, false, false]);
  const [closing, setClosing] = useState<boolean>(false);
  const [numeral, setNumeral] = useState<NumeralSystem>("western");

  const pressLock = useRef<boolean>(false);
  const audioCtx = useRef<AudioContext | null>(null);

  useEffect(() => {
    getTasbeeh().then(setCount);
    try {
      const v = localStorage.getItem("naseem_tasbeeh_vibration");
      if (v !== null) setVibration(v === "1");
      const s = localStorage.getItem("naseem_tasbeeh_sound");
      if (s !== null) setSound(s === "1");
      const d = localStorage.getItem("naseem_tasbeeh_zahra_done");
      if (d) setZahraDone(JSON.parse(d));
      setNumeral(getNumeralSystem());
    } catch { /* ignore */ }
  }, []);

  const persist = useCallback((n: number) => {
    setCount(n);
    saveTasbeeh(n);
  }, []);

  const playChime = useCallback(() => {
    if (!sound) return;
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx.current) audioCtx.current = new Ctx();
      const ctx = audioCtx.current;
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    } catch { /* ignore */ }
  }, [sound]);

  const toggleVibration = () => {
    const next = !vibration;
    setVibration(next);
    localStorage.setItem("naseem_tasbeeh_vibration", next ? "1" : "0");
    haptic.light();
  };

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    localStorage.setItem("naseem_tasbeeh_sound", next ? "1" : "0");
    if (next) playChime();
    haptic.light();
  };

  const currentTarget = openTarget;
  const currentDhikr = openDhikr;

  const handlePress = () => {
    if (pressLock.current) return;
    pressLock.current = true;
    if (vibration) haptic.light();
    const next = count + 1;
    persist(next);
    if (next === currentTarget) {
      if (sound) playChime();
      if (mode === "open") {
        setClosing(true);
      } else {
        setClosing(true);
      }
    }
    setTimeout(() => { pressLock.current = false; }, 120);
  };

  const decrement = () => {
    if (count > 0) { persist(count - 1); haptic.light(); }
  };

  const reset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      haptic.warning();
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    persist(0);
    setClosing(false);
    setConfirmReset(false);
    haptic.success();
    showFeedback("تم التصفير");
  };

  const selectOpenDhikr = (label: string, target: number) => {
    setOpenDhikr(label);
    setOpenTarget(target);
    haptic.light();
  };

  const selectZahraStage = (idx: number) => {
    setMode("zahra");
    setOpenDhikr(ZAHRA_STAGES[idx].dhikr);
    setOpenTarget(ZAHRA_STAGES[idx].target);
    persist(0);
    setClosing(false);
    haptic.light();
  };

  // Beads geometry: distribute `count` beads evenly around the ring
  const beads: { x: number; y: number }[] = [];
  const totalBeads = Math.min(count, currentTarget);
  for (let i = 0; i < totalBeads; i++) {
    const angle = -90 + (i * 360) / currentTarget;
    const rad = (angle * Math.PI) / 180;
    const x = RING_R * Math.cos(rad);
    const y = RING_R * Math.sin(rad);
    beads.push({ x, y });
  }

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div className="flex items-center p-1 rounded-full bg-[#F1EFEC] border border-[#E6E0D8]">
        <button
          type="button"
          onClick={() => { setMode("open"); setClosing(false); persist(0); haptic.light(); }}
          className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${mode === "open" ? "bg-[#4A5D4E] text-white" : "text-[#8C7E6E]"}`}
        >
          تسبيح مفتوح
        </button>
        <button
          type="button"
          onClick={() => { setMode("zahra"); selectZahraStage(0); haptic.light(); }}
          className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${mode === "zahra" ? "bg-[#4A5D4E] text-white" : "text-[#8C7E6E]"}`}
        >
          <Sparkles className="w-3.5 h-3.5" /> تسبيح الزهراء (ع)
        </button>
      </div>

      {/* Settings toggles */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={toggleVibration}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E6E0D8] text-[11px] font-bold text-[#8C7E6E] cursor-pointer transition-colors hover:text-[#2D241E]"
          aria-pressed={vibration}
        >
          {vibration ? <Vibrate className="w-3.5 h-3.5 text-[#4A5D4E]" /> : <VibrateOff className="w-3.5 h-3.5" />}
          الاهتزاز
        </button>
        <button
          type="button"
          onClick={toggleSound}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E6E0D8] text-[11px] font-bold text-[#8C7E6E] cursor-pointer transition-colors hover:text-[#2D241E]"
          aria-pressed={sound}
        >
          {sound ? <Volume2 className="w-3.5 h-3.5 text-[#4A5D4E]" /> : <VolumeX className="w-3.5 h-3.5" />}
          الصوت
        </button>
      </div>

      {/* Open mode dhikr chips */}
      {mode === "open" && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {OPEN_DHIKRS.map((d) => (
            <button
              key={d.label}
              type="button"
              onClick={() => selectOpenDhikr(d.label, d.target)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                openDhikr === d.label ? "bg-[#4A5D4E] border-[#4A5D4E] text-white" : "bg-white border-[#E6E0D8] text-[#8C7E6E] hover:text-[#2D241E]"
              }`}
            >
              {d.label} ({d.target})
            </button>
          ))}
        </div>
      )}

      {/* Zahra mode: selectable stages */}
      {mode === "zahra" && (
        <div className="flex flex-col gap-2">
          {ZAHRA_STAGES.map((s, i) => {
            const isActive = openDhikr === s.dhikr;
            const done = count >= s.target && isActive;
            return (
              <button
                key={s.dhikr}
                type="button"
                onClick={() => selectZahraStage(i)}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#4A5D4E] border-[#4A5D4E] text-white shadow-sm"
                    : "bg-white border-[#E6E0D8] text-[#8C7E6E] hover:text-[#2D241E]"
                }`}
              >
                <span className="text-sm font-bold font-serif">{s.dhikr}</span>
                <span className="flex items-center gap-2 text-xs font-bold">
                  {done && <CheckCircle2 className="w-4 h-4 text-white" />}
                  {isActive ? `${toNumeral(count, numeral)} / ${toNumeral(s.target, numeral)}` : toNumeral(s.target, numeral)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Circular counter with ring and beads */}
      <div className="flex flex-col items-center justify-center p-4 rounded-[32px] bg-white border border-[#E6E0D8] shadow-xs">
        <span className="font-serif text-2xl md:text-3xl font-bold text-[#4A5D4E] text-center px-4">{currentDhikr}</span>
        <span className="text-xs text-[#8C7E6E] mt-1">الهدف: {toNumeral(currentTarget, numeral)}</span>

        <div className="relative w-64 h-64 my-4">
          {/* Thin ring background */}
          <div className="absolute inset-0 rounded-full border-2 border-[#E6E0D8]" />
          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r={RING_R} fill="none" stroke="#E6E0D8" strokeWidth="2" />
            <circle
              cx="100" cy="100" r={RING_R} fill="none" stroke="#4A5D4E" strokeWidth="2"
              strokeDasharray={`${(Math.min(count, currentTarget) / currentTarget) * 603.19} 603.19`}
              strokeLinecap="round"
            />
          </svg>
          {/* Beads on the ring */}
          {beads.map((b, i) => (
            <span
              key={i}
              className="absolute rounded-full pointer-events-none transition-all duration-150"
              style={{
                width: BEAD_SIZE,
                height: BEAD_SIZE,
                backgroundColor: BEAD_COLOR,
                left: `calc(50% + ${b.x}px - ${BEAD_SIZE / 2}px)`,
                top: `calc(50% + ${b.y}px - ${BEAD_SIZE / 2}px)`,
              }}
            />
          ))}
          {/* Central button */}
          <button
            type="button"
            onClick={handlePress}
            aria-label={`تسبيح ${currentDhikr}، العدد الحالي ${toNumeral(count, numeral)} من ${toNumeral(currentTarget, numeral)}`}
            className="absolute inset-0 m-auto w-44 h-44 rounded-full bg-[#4A5D4E] hover:bg-[#3d4d40] text-white shadow-lg border-4 border-[#E6E0D8] flex flex-col items-center justify-center active:scale-95 transition-transform duration-75 cursor-pointer select-none"
          >
            <span className="text-5xl font-mono font-extrabold text-white">{toNumeral(count, numeral)}</span>
            <span className="text-xs font-semibold text-[#D4E2D5] mt-1">اضغط للتسبيح</span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 pt-2">
          <AppButton variant="secondary" size="md" icon={<Minus className="w-4 h-4" />} onPress={decrement}>إنقاص</AppButton>
          <AppButton variant="outline" size="md" icon={<RotateCcw className="w-4 h-4" />} onPress={reset}>
            {confirmReset ? "تأكيد التصفير؟" : "تصفير"}
          </AppButton>
          <AppButton variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onPress={handlePress}>زيادة</AppButton>
        </div>
      </div>

      {/* Closing dua / completion message */}
      {closing && count >= currentTarget && (
        <div className="p-5 rounded-2xl bg-[#D4E2D5]/40 border border-[#B8CEBA] text-center space-y-3">
          <p className="text-base font-bold text-[#2D4232] font-serif">الحمد لله</p>
          <p className="text-sm text-[#2D4232] leading-relaxed font-serif whitespace-pre-line">{CLOSING_DUA}</p>
          <button
            type="button"
            onClick={() => setClosing(false)}
            className="text-[11px] text-[#4A5D4E] font-bold cursor-pointer hover:underline"
          >
            إغلاق
          </button>
        </div>
      )}
    </div>
  );
};

export default TasbeehView;
