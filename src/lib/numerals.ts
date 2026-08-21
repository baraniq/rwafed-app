export type NumeralSystem = "western" | "arabic" | "indian" | "persian";

const NUMERAL_MAPS: Record<NumeralSystem, string[]> = {
  western: ["0","1","2","3","4","5","6","7","8","9"],
  arabic:  ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"],
  indian:  ["०","१","२","३","४","५","६","७","८","९"],
  persian: ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"],
};

export const NUMERAL_LABELS: Record<NumeralSystem, string> = {
  western: "غربية (0-9)",
  arabic:  "عربية (٠-٩)",
  indian:  "هندية (०-९)",
  persian: "فارسية (۰-۹)",
};

export function toNumeral(n: number, system: NumeralSystem): string {
  if (system === "western") return String(n);
  const map = NUMERAL_MAPS[system];
  return String(n)
    .split("")
    .map((ch) => {
      const d = ch.charCodeAt(0) - 48;
      return d >= 0 && d <= 9 ? map[d] : ch;
    })
    .join("");
}

export function parseNumeral(str: string): number {
  if (!str) return 0;
  let cleaned = String(str);
  const arabic = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
  const indian = ["०","१","२","३","४","५","६","७","८","९"];
  const persian = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];

  for (let i = 0; i < 10; i++) {
    const regA = new RegExp(arabic[i], "g");
    const regI = new RegExp(indian[i], "g");
    const regP = new RegExp(persian[i], "g");
    cleaned = cleaned.replace(regA, String(i)).replace(regI, String(i)).replace(regP, String(i));
  }

  cleaned = cleaned.replace(/[^0-9.-]/g, "");
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

let _cachedSystem: NumeralSystem | null = null;

export function getNumeralSystem(): NumeralSystem {
  if (_cachedSystem) return _cachedSystem;
  try {
    const s = localStorage.getItem("naseem_numeral_system") as NumeralSystem | null;
    _cachedSystem = s && NUMERAL_MAPS[s] ? s : "western";
  } catch {
    _cachedSystem = "western";
  }
  return _cachedSystem;
}

export function setNumeralSystem(sys: NumeralSystem) {
  _cachedSystem = sys;
  localStorage.setItem("naseem_numeral_system", sys);
}
