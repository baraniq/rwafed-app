import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHANNEL = "Sadaka_Ta";
const DB_URL = "https://nsem-320eb-default-rtdb.asia-southeast1.firebasedatabase.app";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

const ARROW = "\u25C0(?:\uFE0F)?";

const AR_D = {
  "٠": 0, "١": 1, "٢": 2, "٣": 3, "٤": 4, "٥": 5, "٦": 6, "٧": 7, "٨": 8, "٩": 9,
  "۰": 0, "۱": 1, "۲": 2, "۳": 3, "۴": 4, "۵": 5, "۶": 6, "۷": 7, "۸": 8, "۹": 9,
};

const MONTHS = {
  "كانون الثاني": 1,
  "شباط": 2,
  "اذار": 3,
  "نيسان": 4,
  "ايار": 5,
  "مايس": 5,
  "حزيران": 6,
  "تموز": 7,
  "اب": 8,
  "ايلول": 9,
  "تشرين الاول": 10,
  "تشرين الثاني": 11,
  "كانون الاول": 12,
};

const MARKERS = [
  ["events", /🗓\s*وقائع اليوم\s*:/],
  ["warning", /⚠(?:\uFE0F)?\s*تنبيه هام[^:]*:/],
  ["nufahat", /🚩\s*من نفحات زيارة عاشوراء\s*:/],
  ["fadael", /✨\s*من فضائل أمير المؤمنين\s*\(ع\)\s*:/],
  ["hikma", /۞\s*حكمة اليوم\s*:/],
  ["sira", /🕊(?:\uFE0F)?\s*من سيرة الإمام المنتظر\s*\(عج\)\s*:/],
  ["ziyara", /۞\s*زيارة اليوم\s*:/],
  ["dua", /🤲\s*دعاء يوم[^:]*:/],
  ["taweezh", /🛡(?:\uFE0F)?\s*تعويذة يوم[^:]*:/],
  ["dhikr", /📿\s*ذكر اليوم\s*:/],
  ["istighfar", /📿\s*الاستغفار اليومي المعتبر\s*:/],
  ["adhkar", /📿\s*أذكار عامة\s*:/],
  ["wird", /📖\s*الورد القرآني\s*:/],
  ["sadaqa", /💰\s*صدقة اليوم\s*:/],
  ["fiqh", /🚿\s*تنبيهات فقهية\s*:/],
  ["travel", /(?:[❌✅]\s*)?(?:🔰\s*)?السفر\s*:/],
  ["marital", /(?:[❌✅]\s*)?(?:🔰\s*)?المقاربة الزوجية[^:]*:/],
  ["clothes", /(?:[❌✅]\s*)?(?:🔰\s*)?إقتناء الملابس[^:]*:/],
  ["hair", /(?:[❌✅]\s*)?(?:🔰\s*)?إصلاح الشعر[^:]*:/],
  ["nails", /(?:[❌✅]\s*)?تقليم الأظافر\s*:/],
];

function toWestern(s) {
  return String(s).replace(/[٠-٩۰-۹]/g, (c) => String(AR_D[c]));
}

function normalizeArabic(s) {
  return s
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي");
}

function decodeHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(Number(n)));
}

function extractMessages(html) {
  const out = [];
  const posts = [...html.matchAll(/data-post="[^"]*\/(\d+)"/g)];
  for (const p of posts) {
    const id = p[1];
    const after = html.slice(p.index);
    const next = after.search(/<div class="tgme_widget_message_wrap|<section/);
    const scope = next >= 0 ? after.slice(0, next) : after;
    const m = scope.match(/tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/);
    if (!m) continue;
    out.push({ id, text: decodeHtml(m[1]) });
  }
  return out;
}

function clean(s) {
  return s
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function extractSections(text) {
  const out = {};
  const pos = [];
  for (const [key, re] of MARKERS) {
    const m = text.match(re);
    if (m) pos.push({ idx: m.index, key, end: m.index + m[0].length });
  }
  pos.sort((a, b) => a.idx - b.idx);
  let end = text.length;
  const noteIdx = text.search(/📌\s*ملاحظة/);
  if (noteIdx >= 0) end = Math.min(end, noteIdx);
  const sourcesIdx = text.search(/الدروع الواقية/);
  if (sourcesIdx >= 0) end = Math.min(end, sourcesIdx);
  for (let i = 0; i < pos.length; i++) {
    const start = pos[i].end;
    const stop = i + 1 < pos.length ? pos[i + 1].idx : end;
    if (start < stop) out[pos[i].key] = clean(text.slice(start, stop));
  }
  return out;
}

function parseCalendar(text) {
  if (!text.includes("#التقويم_الإسلامي")) return null;
  const g = text.match(
    new RegExp(`${ARROW}\\s*([٠-٩۰-۹0-9]+)\\s*/\\s*([^\\s/]+?)\\s*/\\s*([٠-٩۰-۹0-9]+)\\s*م`)
  );
  if (!g) return null;
  const day = parseInt(toWestern(g[1]), 10);
  const month = MONTHS[normalizeArabic(g[2])];
  const year = parseInt(toWestern(g[3]), 10);
  if (!month || !year || !day) return null;
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const afterG = text.slice(g.index + g[0].length);
  const h = afterG.match(new RegExp(`${ARROW}\\s*([^◀]+?)\\s*هـ`));
  const w = text.match(/ليوم\s*([^:◀]+?)\s*:/);
  return {
    iso,
    entry: {
      weekday: w ? w[1].trim() : "",
      gregorian: g[0].replace(/^\u25C0(?:\uFE0F)?\s*/, "").trim(),
      hijri: h ? `${h[1].trim()} هـ` : "",
      ...extractSections(text),
    },
  };
}

async function fetchPage(before) {
  const url = before
    ? `https://t.me/s/${CHANNEL}?before=${before}`
    : `https://t.me/s/${CHANNEL}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function put(pathName, body) {
  const res = await fetch(`${DB_URL}${pathName}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${pathName} -> ${res.status} ${await res.text()}`);
  return res.json();
}

(async () => {
  const entries = new Map();
  let before = null;
  let emptyPages = 0;
  for (let page = 0; page < 40; page++) {
    const html = await fetchPage(before);
    const msgs = extractMessages(html);
    let found = 0;
    for (const m of msgs) {
      const p = parseCalendar(m.text);
      if (p && !entries.has(p.iso)) {
        entries.set(p.iso, p.entry);
        found++;
      }
    }
    console.log(`page ${page}: ${msgs.length} msgs, ${found} new calendar entries`);
    if (msgs.length === 0) break;
    before = Math.min(...msgs.map((m) => Number(m.id)));
    if (found === 0) emptyPages++;
    else emptyPages = 0;
    if (emptyPages >= 2) break;
  }

  const sorted = [...entries.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [iso, entry] of sorted) {
    if (!entry.weekday) {
      console.log("SKIP (no weekday):", iso);
      continue;
    }
    await put(`/dailyCalendar/${iso}`, { ...entry, source: CHANNEL, syncedAt: new Date().toISOString() });
    console.log("SEEDED", iso, "-", entry.weekday, "-", entry.hijri);
  }
  console.log("DONE", sorted.length, "entries");
})().catch((e) => {
  console.error("ERROR", e);
  process.exit(1);
});
