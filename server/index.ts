import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = parseInt(process.env.PORT || "3001", 10);
const HOST = process.env.HOST || "0.0.0.0";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data.json");

let genAI: GoogleGenerativeAI | null = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

// --- Persistent storage (JSON file) ---
interface Store {
  khatmahs: any[];
  duaRequests: any[];
  notifications: any[];
}

const defaultStore: Store = { khatmahs: [], duaRequests: [], notifications: [] };

function loadStore(): Store {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(raw);
      return {
        khatmahs: parsed.khatmahs || [],
        duaRequests: parsed.duaRequests || [],
        notifications: parsed.notifications || [],
      };
    }
  } catch (err) {
    console.error("Failed to load data file:", err);
  }
  return { khatmahs: [], duaRequests: [], notifications: [] };
}

function saveStore(store: Store): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save data file:", err);
  }
}

let store: Store = loadStore();

function persistKhatmahs() {
  saveStore({ ...store, khatmahs: store.khatmahs });
}
function persistDuas() {
  saveStore({ ...store, duaRequests: store.duaRequests });
}
function persistNotifications() {
  saveStore({ ...store, notifications: store.notifications });
}

// --- AI Training System Prompt for "اسال ويام" ---
const AI_SYSTEM_PROMPT = `أنت مساعد إسلامي ذكي اسمه "اسال ويام"، جزء من تطبيق "نسيم" للبناء الذاتي الإسلامي.

تعتمد على قاعدة معرفة إسلامية موثقة ومستقلة، مستندة إلى القرآن الكريم والسنة وأصول التربية الإسلامية، مع الاستفادة من تراث ست شخصيات علمائية وفكرية وتربوية:

1. السيد محمد باقر الصدر - المؤلفات الفكرية والأصولية والاقتصادية، المحاضرات، الرسائل، والمواد التربوية الموثقة من مركز أبحاثه ومؤلفاته المحققة.
2. السيد محمد محمد صادق الصدر - خطب الجمعة، الاستفتاءات، الدروس، المؤلفات، التقريرات، الرسائل والمقالات، والبحوث المنشورة في هيئة تراثه.
3. الإمام روح الله الموسوي الخميني - المؤلفات الأخلاقية والعرفانية والفقهية والأصولية، الرسائل، الكلمات، والبيانات من المصادر المعتمدة لآثاره.
4. السيد علي الخامنئي - الخطب، الرسائل والنداءات، الأفكار والرؤى، المؤلفات، الاستفتاءات، والسيرة المنشورة في الموقع الرسمي.
5. السيد عباس الموسوي - الخطب والكلمات والرسائل والمواقف الموثقة من أرشيفه المؤسسي، مع تثبيت التاريخ والمكان والمناسبة.
6. سيد حسن نصر الله - الخطب والبيانات والمقابلات والكلمات المسجلة أو المفرغة من الأرشيفات الإعلامية الموثوقة، مع إرفاق التسجيل أو النص الأصلي متى توفر.

قواعد صارمة:
- لا تتعامل مع الشخصيات الست على أنها مصدر واحد، ولا تنسب قولًا أو موقفًا أو حكمًا إلى أي منهم إلا بوجود مصدر موثق.
- ميّز دائمًا بين النص الأصلي، والترجمة، والتلخيص، والاستنتاج.
- لا تخترع اقتباسات، ولا تملأ الفراغات بالتخمين، واذكر المصدر عند تقديم كل معلومة جوهرية.
- استخدم نوع المادة بوضوح: اقتباس حرفي موثق، أو تلخيص أمين، أو تطبيق تربوي مستنبط.
- لا يجوز إنشاء أقوال أو نسبتها إلى أي شخصية من دون مصدر صريح.
- اعتمد مبدأ التحقق: مصدر أصلي أو مؤسسة مرتبطة بالتراث.
- إذا لم يتوفر مصدر كافٍ، اصرّح بعدم ثبوت المعلومة بدل تقديمها كحقيقة.
- فصل المحتوى الفكري والتربوي عن الفتوى والحكم الشرعي؛ فالفتاوى والأحكام لا تُقدم إلا مع مصدرها الفقهي الواضح وتنبيه المستخدم إلى الرجوع إلى مرجعه الشرعي.

مجالات رئيسية:
- القرآن الكريم: تفسير وتلاوة وتدبر
- الصلاة والعبادات: تحسين الخشوع والالتزام
- الذكر والدعاء: أذكار مأثورة وأدعية أهل البيت
- الأخلاق والسلوك: تطوير الشخصية الإسلامية
- تنظيم الوقت وإدارة الحياة اليومية
- مقاومة العادات السلبية وبناء عادات إيجابية
- خدمة الأسرة والمجتمع

رد بالعربية، بشكل مختصر ومفيد، مع التزام تام بالموثوقية والمصادر.`;

// --- API Routes ---

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Khatmah CRUD
app.get("/api/khatmahs", (_req, res) => {
  res.json(store.khatmahs);
});

app.post("/api/khatmahs", (req, res) => {
  const { name, totalParts } = req.body;
  const id = `khatma_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const khatma = {
    id,
    name: name || "ختمة جماعية",
    createdAt: new Date().toISOString(),
    totalParts: totalParts || 30,
    parts: Array.from({ length: Math.max(1, Math.min(30, totalParts || 30)) }, (_, i) => ({
      id: `part_${i + 1}`,
      khatmaId: id,
      partNumber: i + 1,
      status: "available" as const,
    })),
  };
  store.khatmahs.unshift(khatma);
  persistKhatmahs();
  res.json(khatma);
});

app.post("/api/khatmahs/:id/parts/:partNumber/reserve", (req, res) => {
  const { id, partNumber } = req.params;
  const { deviceId, deviceName } = req.body;
  const khatma = store.khatmahs.find((k) => k.id === id);
  if (!khatma) return res.status(404).json({ error: "Khatmah not found" });
  const part = khatma.parts.find((p: any) => p.partNumber === parseInt(partNumber));
  if (!part) return res.status(404).json({ error: "Part not found" });
  if (part.status !== "available") return res.status(409).json({ error: "Part not available" });
  part.status = "reserved";
  part.reservedBy = deviceName || deviceId || "مستخدم";
  part.reservedAt = new Date().toISOString();
  persistKhatmahs();
  res.json(part);
});

app.post("/api/khatmahs/:id/parts/:partNumber/complete", (req, res) => {
  const { id, partNumber } = req.params;
  const khatma = store.khatmahs.find((k) => k.id === id);
  if (!khatma) return res.status(404).json({ error: "Khatmah not found" });
  const part = khatma.parts.find((p: any) => p.partNumber === parseInt(partNumber));
  if (!part) return res.status(404).json({ error: "Part not found" });
  part.status = "completed";
  part.completedAt = new Date().toISOString();
  persistKhatmahs();
  res.json(part);
});

// Dua Requests
app.get("/api/duas", (_req, res) => {
  res.json(store.duaRequests);
});

app.post("/api/duas", (req, res) => {
  const { name, duaText, category, anonymous, deviceFingerprint } = req.body;
  const dua = {
    id: `dua_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: anonymous ? "مجهول" : name || "مجهول",
    duaText,
    category: category || "عام",
    timestamp: new Date().toISOString(),
    anonymous,
    deviceFingerprint,
    prayCount: 0,
  };
  store.duaRequests.unshift(dua);
  persistDuas();
  res.json(dua);
});

app.post("/api/duas/:id/pray", (req, res) => {
  const dua = store.duaRequests.find((d) => d.id === req.params.id);
  if (!dua) return res.status(404).json({ error: "Dua not found" });
  dua.prayCount += 1;
  persistDuas();
  res.json(dua);
});

// Notifications
app.get("/api/notifications", (_req, res) => {
  res.json(store.notifications);
});

// --- AI Chat Endpoint for "اسال ويام" ---
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!genAI) {
      return res.json({
        reply:
          "عذراً، ميزة المساعد الذكي غير متاحة حالياً. يرجى إعداد مفتاح Gemini API على الخادم.",
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: AI_SYSTEM_PROMPT }] },
        {
          role: "model",
          parts: [
            {
              text: "فهمت. أنا 'اسال ويام'، المساعد الإسلامي الذكي في تطبيق نسيم. سأعتمد على القاعدة المعرفية الموثقة مع مراعاة جميع القواعد الصارمة المحددة. كيف يمكنني مساعدتك؟",
            },
          ],
        },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error: any) {
    console.error("AI Chat error:", error);
    res.json({
      reply: "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.",
    });
  }
});

// --- Serve the built app (same origin as API) ---
const distDir = path.resolve(__dirname, "../dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
  console.log(`Serving static app from ${distDir}`);
} else {
  console.log("dist folder not found; API-only mode.");
}

app.listen(PORT, HOST, () => {
  console.log(`naseem server running on http://${HOST}:${PORT}`);
});