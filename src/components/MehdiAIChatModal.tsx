import React, { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { haptic } from "../lib/haptics";
import AppButton from "./AppButton";
import {
  X,
  Send,
  Bot,
  User,
  Loader2,
  ChevronDown,
  ShieldAlert,
  Flag,
  BookOpen,
  Check,
} from "lucide-react";
import {
  GEMINI_API_KEY,
  GEMINI_MODEL,
  MUJEEB_SYSTEM_PROMPT,
  MUJEEB_WELCOME,
  ANSWER_MODES,
  SCHOLARS,
  AnswerMode,
} from "../lib/aiKnowledge";

interface MehdiAIChatModalProps {
  visible: boolean;
  onClose: () => void;
  currentView?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ContextPanel {
  open: boolean;
  modeId: string;
  scholarKey: string;
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const MehdiAIChatModal: React.FC<MehdiAIChatModalProps> = ({ visible, onClose, currentView }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: MUJEEB_WELCOME },
  ]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyBufferRef = useRef<string>("");

  const [context, setContext] = useState<ContextPanel>({
    open: false,
    modeId: "general",
    scholarKey: "",
  });
  const [reportedId, setReportedId] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const currentMode: AnswerMode =
    ANSWER_MODES.find((m) => m.id === context.modeId) || ANSWER_MODES[4];

  const buildContextText = (): string => {
    let txt = `\n\n[وضع الإجابة المختار: ${currentMode.label}]`;
    if (currentMode.id === "source" || currentMode.id === "fiqh") {
      if (context.scholarKey) {
        const sc = SCHOLARS.find((s) => s.key === context.scholarKey);
        txt += `\n[العالم/المرجع المختار: ${sc ? sc.name : ""}]`;
      } else if (currentMode.id === "fiqh") {
        txt += `\n[تنبيه: لم يحدد المستخدم مرجعاً — اطلب منه تحديد المرجع قبل الجواب]`;
      }
    }
    if (currentView) {
      const sectionNames: Record<string, string> = {
        home: "الرئيسية",
        quran: "القرآن الكريم (المصحف + التفاسير + الإعراب)",
        khatmah: "الختمات الجماعية",
        istikhara: "الاستخارة",
        devotions: "الأدعية والزيارات",
        risalah: "الرسائل الفقهية",
        calculators: "الحاسبات الفقهية (المسبحة، القضاء، المواريث، الخمس)",
        dailyacts: "أعمال اليوم",
        dailycalendar: "التقويم اليومي",
        settings: "الإعدادات",
      };
      const name = sectionNames[currentView] || currentView;
      txt += `\n[القسم الذي يتصفحه المستخدم حالياً: ${name} — وجّه الجواب بما يناسب هذا القسم]`;
    }
    return txt;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim() + buildContextText();
    const userMessage: ChatMessage = { role: "user", content: userText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    haptic.light();

    try {
      if (!GEMINI_API_KEY) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "المساعد الذكي غير مفعّل حالياً." },
        ]);
        setIsLoading(false);
        return;
      }

      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: MUJEEB_SYSTEM_PROMPT }] },
          {
            role: "model",
            parts: [
              {
                text: "فهمت. أنا مجيب، مرشد بناء الذات في تطبيق روافد. كيف أساعدك؟",
              },
            ],
          },
          ...messages.map((m) => ({
            role: m.role === "user" ? ("user" as const) : ("model" as const),
            parts: [{ text: m.content }],
          })),
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      });

      replyBufferRef.current = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const result = await chat.sendMessageStream(userText);
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          replyBufferRef.current += text;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: replyBufferRef.current,
            };
            return updated;
          });
        }
      }
    } catch (error) {
      console.error("Mujeeb error:", error);
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant" && !last.content) {
          updated[updated.length - 1] = {
            role: "assistant",
            content: "يرجى المحاولة مرة أخرى.",
          };
        } else {
          updated.push({
            role: "assistant",
            content: "يرجى المحاولة مرة أخرى.",
          });
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReport = () => {
    haptic.light();
    setReportedId("reported");
    setTimeout(() => setReportedId(null), 2000);
  };

  const handleRequestReview = () => {
    haptic.light();
    setReportedId("review");
    setTimeout(() => setReportedId(null), 2000);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#2D241E]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="w-full max-w-lg h-[85vh] rounded-[32px] bg-white border border-[#E6E0D8] shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-[#E6E0D8] bg-[#FAF8F5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#4A5D4E] text-white flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold font-serif text-black">مجيب</h3>
              <p className="text-[11px] text-[#8C7E6E]">المساعد الذكي الموثوق</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-[#8C7E6E] hover:text-black hover:bg-[#E6E0D8] transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F9F7F5]">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#4A5D4E] text-white rounded-br-md"
                  : "bg-white border border-[#E6E0D8] text-black rounded-bl-md"
              }`}>
                <div className="flex items-start gap-2">
                  {msg.role === "assistant" && <Bot className="w-4 h-4 text-[#4A5D4E] shrink-0 mt-0.5" />}
                  {msg.role === "user" && <User className="w-4 h-4 text-white shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <span className="whitespace-pre-wrap block">{msg.content}</span>
                    {msg.role === "assistant" && messages.length > 1 && idx === messages.length - 1 && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#E6E0D8]/60">
                        <button
                          type="button"
                          onClick={handleReport}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-[#8C7E6E] hover:bg-[#F1EFEC] cursor-pointer transition-colors"
                        >
                          {reportedId === "reported" ? <Check className="w-3 h-3 text-emerald-600" /> : <Flag className="w-3 h-3" />}
                          {reportedId === "reported" ? "تم البلاغ" : "أبلغ عن خطأ"}
                        </button>
                        <button
                          type="button"
                          onClick={handleRequestReview}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-[#8C7E6E] hover:bg-[#F1EFEC] cursor-pointer transition-colors"
                        >
                          {reportedId === "review" ? <Check className="w-3 h-3 text-emerald-600" /> : <ShieldAlert className="w-3 h-3" />}
                          {reportedId === "review" ? "تم الطلب" : "اطلب مراجعة"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-end">
              <div className="bg-white border border-[#E6E0D8] p-4 rounded-2xl rounded-bl-md">
                <Loader2 className="w-5 h-5 text-[#4A5D4E] animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Context selector (mode + scholar) */}
        <div className="px-4 pb-1 shrink-0 bg-white">
          <button
            type="button"
            onClick={() => setContext((c) => ({ ...c, open: !c.open }))}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#F1EFEC] border border-[#E6E0D8] text-xs font-bold text-black cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#4A5D4E]" />
              الوضع: {currentMode.label}
              {context.scholarKey && (
                <span className="text-[#4A5D4E]">• {SCHOLARS.find((s) => s.key === context.scholarKey)?.name}</span>
              )}
            </span>
            <ChevronDown className={`w-4 h-4 text-[#8C7E6E] transition-transform ${context.open ? "rotate-180" : ""}`} />
          </button>

          {context.open && (
            <div className="mt-2 max-h-52 overflow-y-auto space-y-1 pb-2">
              <p className="text-[10px] text-[#8C7E6E] px-1">اختر وضع الإجابة</p>
              {ANSWER_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setContext((c) => ({ ...c, modeId: m.id }))}
                  className={`w-full text-right p-2 rounded-lg text-xs cursor-pointer transition-colors ${context.modeId === m.id ? "bg-[#D4E2D5] text-black" : "hover:bg-[#F1EFEC]"}`}
                >
                  <span className="font-bold">{m.label}</span>
                  <span className="block text-[10px] text-[#8C7E6E]">{m.description}</span>
                </button>
              ))}
              {(currentMode.id === "source" || currentMode.id === "fiqh") && (
                <>
                  <p className="text-[10px] text-[#8C7E6E] px-1 pt-2">اختر العالم / المرجع</p>
                  {SCHOLARS.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setContext((c) => ({ ...c, scholarKey: s.key }))}
                      className={`w-full text-right p-2 rounded-lg text-xs cursor-pointer transition-colors ${context.scholarKey === s.key ? "bg-[#D4E2D5] text-black" : "hover:bg-[#F1EFEC]"}`}
                    >
                      {s.name}
                      <span className="block text-[10px] text-[#8C7E6E]">{s.domain}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[#E6E0D8] bg-white shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
              placeholder="اسأل مجيب عن أي شيء..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-[#F1EFEC] border border-[#E6E0D8] text-sm text-black placeholder-[#8C7E6E] focus:outline-none focus:border-[#4A5D4E]"
            />
            <AppButton variant="primary" size="md" icon={<Send className="w-4 h-4" />} onPress={sendMessage} disabled={!input.trim() || isLoading}>
              إرسال
            </AppButton>
          </div>
          <p className="text-[10px] text-[#8C7E6E] mt-2 text-center">
            يعتمد على مصادر موثوقة. لا يُقدم فتاوى شرعية بديلاً عن المرجع أو وكيله أو مكتبه الرسمي.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MehdiAIChatModal;