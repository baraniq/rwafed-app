import React, { useState, useEffect } from "react";
import { Khatma, KhatmaPart, DuaRequest } from "../types";
import {
  subscribeKhatmahs,
  subscribeDuas,
  createKhatmah,
  reservePart,
  completePart,
  submitDuaRequest,
  prayForDua,
  deleteKhatmah,
  deleteDuaRequest,
  getDeviceProfile,
} from "../lib/community";
import { haptic } from "../lib/haptics";
import AppButton from "./AppButton";
import {
  Users,
  Plus,
  CheckCircle2,
  Clock,
  Heart,
  Send,
  RefreshCw,
  Loader2,
  BookOpen,
  EyeOff,
  Trash2,
} from "lucide-react";

interface KhatmahViewProps {
  showFeedback: (msg: string) => void;
}

export const KhatmahView: React.FC<KhatmahViewProps> = ({ showFeedback }) => {
  const [khatmahs, setKhatmahs] = useState<Khatma[]>([]);
  const [duas, setDuas] = useState<DuaRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"khatmah" | "dua">("khatmah");
  const [loading, setLoading] = useState<boolean>(false);

  // Create Khatmah form
  const [newKhatmahName, setNewKhatmahName] = useState<string>("");
  const [newKhatmahParts, setNewKhatmahParts] = useState<number>(30);

  // Create Dua form
  const [duaName, setDuaName] = useState<string>("");
  const [duaCategory, setDuaCategory] = useState<string>("عام");
  const [duaAnonymous, setDuaAnonymous] = useState<boolean>(true);

  const device = getDeviceProfile();

  // Blocked posts (stored locally per device)
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem("naseem_blocked_posts");
      if (raw) setBlockedIds(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
  }, []);

  const toggleBlock = (id: string) => {
    setBlockedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem("naseem_blocked_posts", JSON.stringify([...next]));
      return next;
    });
    haptic.light();
  };

  const visibleKhatmahs = khatmahs.filter((k) => !blockedIds.has(k.id));
  const visibleDuas = duas.filter((d) => !blockedIds.has(d.id));
  const blockedKhatmahs = khatmahs.filter((k) => blockedIds.has(k.id));
  const blockedDuas = duas.filter((d) => blockedIds.has(d.id));

  useEffect(() => {
    const unsubK = subscribeKhatmahs((k) => setKhatmahs(k));
    const unsubD = subscribeDuas((d) => setDuas(d));
    setLoading(false);
    return () => {
      unsubK();
      unsubD();
    };
  }, []);

  const handleCreateKhatmah = async () => {
    if (!newKhatmahName.trim()) return;
    try {
      const khatma = await createKhatmah(newKhatmahName, newKhatmahParts);
      setKhatmahs((prev) => [khatma, ...prev]);
      setNewKhatmahName("");
      haptic.success();
      showFeedback("تم إنشاء الختمة الجماعية");
    } catch (err) {
      showFeedback("حدث خطأ أثناء الإنشاء");
    }
  };

  const handleReservePart = async (khatmaId: string, partNumber: number) => {
    try {
      await reservePart(khatmaId, partNumber);
      haptic.success();
      showFeedback("تم حجز الجزء بنجاح");
    } catch (err) {
      showFeedback("الجزء محجوز مسبقاً");
    }
  };

  const handleCompletePart = async (khatmaId: string, partNumber: number) => {
    try {
      await completePart(khatmaId, partNumber);
      haptic.success();
      showFeedback("تم إكمال الجزء");
    } catch (err) {
      showFeedback("حدث خطأ");
    }
  };

  const handleSubmitDua = async () => {
    const genericText = "أدعو الله أن يستجيب دعوات المسلمين وأن يفرّج كرب المكروبين ويرزق الجميع الخير والبركة. اللهم صلِّ على محمد وآل محمد.";
    try {
      const dua = await submitDuaRequest(duaName, genericText, duaCategory, duaAnonymous);
      setDuas((prev) => [dua, ...prev]);
      setDuaName("");
      haptic.success();
      showFeedback("تم طلب الدعاء");
    } catch (err) {
      showFeedback("حدث خطأ أثناء الطلب");
    }
  };

  const handlePrayForDua = async (duaId: string) => {
    try {
      const updated = await prayForDua(duaId);
      setDuas((prev) => prev.map((d) => (d.id === duaId ? updated : d)));
      haptic.light();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteKhatmah = async (khatmaId: string) => {
    if (!window.confirm("هل تريد حذف هذه الختمة نهائياً؟")) return;
    try {
      const ok = await deleteKhatmah(khatmaId);
      if (ok) {
        haptic.success();
        showFeedback("تم حذف الختمة");
      } else {
        showFeedback("لا يمكنك حذف ختمة ليست ملكك");
      }
    } catch (err) {
      showFeedback("حدث خطأ أثناء الحذف");
    }
  };

  const handleDeleteDua = async (duaId: string) => {
    if (!window.confirm("هل تريد حذف هذا الدعاء نهائياً؟")) return;
    try {
      const ok = await deleteDuaRequest(duaId);
      if (ok) {
        haptic.success();
        showFeedback("تم حذف الدعاء");
      } else {
        showFeedback("لا يمكنك حذف دعاء ليس ملكك");
      }
    } catch (err) {
      showFeedback("حدث خطأ أثناء الحذف");
    }
  };

  return (
    <div id="khatmah-container" className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="rounded-[32px] bg-white border border-[#E6E0D8] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-[#F1EFEC] text-[#4A5D4E] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-[#2D241E] font-serif">الختمات الجماعية</h2>
              <p className="text-xs text-[#8C7E6E]">شارك في ختم القرآن مع المسلمين حول العالم</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4E2D5]/40 text-[#2D4232] text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4A5D4E] animate-pulse" /> مباشر
          </span>
        </div>

        {/* Tabs */}
        <div className="flex items-center p-1 rounded-full bg-[#F1EFEC] border border-[#E6E0D8]">
          <button type="button" onClick={() => setActiveTab("khatmah")} className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "khatmah" ? "bg-[#4A5D4E] text-white" : "text-[#8C7E6E]"}`}>
            <BookOpen className="w-3.5 h-3.5" /> الختمات
          </button>
          <button type="button" onClick={() => setActiveTab("dua")} className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "dua" ? "bg-[#4A5D4E] text-white" : "text-[#8C7E6E]"}`}>
            <Heart className="w-3.5 h-3.5" /> الدعاء الجماعي
          </button>
        </div>
      </div>

      {/* Khatmah Tab */}
      {activeTab === "khatmah" && (
        <div className="space-y-4">
          {/* Create Form */}
          <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#2D241E] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#4A5D4E]" /> إنشاء ختمة جديدة
            </h3>
            <div className="flex items-center gap-3">
              <input type="text" value={newKhatmahName} onChange={(e) => setNewKhatmahName(e.target.value)} placeholder="اسم الختمة..." className="flex-1 px-4 py-2.5 rounded-2xl bg-[#F1EFEC] border border-[#E6E0D8] text-sm focus:outline-none focus:border-[#4A5D4E]" />
              <input type="number" min="1" max="30" value={newKhatmahParts} onChange={(e) => setNewKhatmahParts(parseInt(e.target.value) || 30)} className="w-20 px-3 py-2.5 rounded-2xl bg-[#F1EFEC] border border-[#E6E0D8] text-sm text-center focus:outline-none focus:border-[#4A5D4E]" />
              <AppButton variant="primary" size="md" onPress={handleCreateKhatmah}>إنشاء</AppButton>
            </div>
          </div>

          {/* Khatmahs List */}
          {visibleKhatmahs.length === 0 ? (
            <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-8 text-center text-[#8C7E6E] text-sm">
              {khatmahs.length === 0 ? "لا توجد ختمات بعد. أنشئ ختمة جديدة للبدء!" : "تم حجب جميع الختمات. اضغط أيقونة العين لإظهارها."}
            </div>
          ) : (
            visibleKhatmahs.map((khatma) => {
              const completed = khatma.parts.filter((p) => p.status === "completed").length;
              const progress = Math.round((completed / khatma.parts.length) * 100);
              return (
                <div key={khatma.id} className="rounded-[24px] bg-white border border-[#E6E0D8] p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#2D241E] font-serif">{khatma.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#8C7E6E]">{completed}/{khatma.parts.length} ({progress}%)</span>
                      {khatma.ownerFingerprint === device.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteKhatmah(khatma.id)}
                          title="حذف الختمة"
                          className="p-1.5 rounded-lg text-[#C0392B] hover:text-[#A93226] hover:bg-[#FDEDEC] cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleBlock(khatma.id)}
                        title="حجب المنشور"
                        className="p-1.5 rounded-lg text-[#8C7E6E] hover:text-[#2D241E] hover:bg-[#F1EFEC] cursor-pointer transition-colors"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E6E0D8]">
                    <div className="h-full rounded-full bg-[#4A5D4E] transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                    {khatma.parts.map((part) => (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => {
                          if (part.status === "available") handleReservePart(khatma.id, part.partNumber);
                          else if (part.status === "reserved" && part.reservedBy === device.name) handleCompletePart(khatma.id, part.partNumber);
                          haptic.light();
                        }}
                        className={`p-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                          part.status === "completed" ? "bg-[#4A5D4E] text-white" : part.status === "reserved" ? "bg-[#FFE5D9] text-[#8C4E3E] border border-[#FFD0BD]" : "bg-[#F1EFEC] text-[#8C7E6E] hover:bg-[#E6E0D8] border border-[#E6E0D8]"
                        }`}
                      >
                        {part.partNumber}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          {/* Blocked Khatmahs */}
          {blockedKhatmahs.length > 0 && (
            <div className="rounded-[24px] bg-white border border-dashed border-[#E6E0D8] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#8C7E6E] flex items-center gap-2">
                  <EyeOff className="w-4 h-4" /> الختمات المحجوبة ({blockedKhatmahs.length})
                </h4>
                <button
                  type="button"
                  onClick={() => blockedKhatmahs.forEach((k) => toggleBlock(k.id))}
                  className="text-[11px] text-[#4A5D4E] font-bold cursor-pointer hover:underline"
                >
                  إظهار الكل
                </button>
              </div>
              <div className="space-y-2">
                {blockedKhatmahs.map((khatma) => (
                  <div key={khatma.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F9F7F5] border border-[#E6E0D8]">
                    <span className="text-xs font-bold text-[#2D241E]">{khatma.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleBlock(khatma.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#E6E0D8] text-[#4A5D4E] text-xs font-bold cursor-pointer hover:bg-[#F1EFEC] transition-colors"
                    >
                      <EyeOff className="w-3.5 h-3.5" /> إظهار
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dua Tab */}
      {activeTab === "dua" && (
        <div className="space-y-4">
          {/* Submit Dua Form */}
          <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#2D241E] flex items-center gap-2">
              <Send className="w-4 h-4 text-[#4A5D4E]" /> اطلب دعاءً من الجماعة
            </h3>
            <div className="flex items-center gap-3">
              <input type="text" value={duaName} onChange={(e) => setDuaName(e.target.value)} placeholder="اسمك (اختياري)" className="flex-1 px-4 py-2.5 rounded-2xl bg-[#F1EFEC] border border-[#E6E0D8] text-sm focus:outline-none" disabled={duaAnonymous} />
              <label className="flex items-center gap-2 text-xs text-[#2D241E] cursor-pointer">
                <input type="checkbox" checked={duaAnonymous} onChange={(e) => setDuaAnonymous(e.target.checked)} className="accent-[#4A5D4E]" />
                مجهول
              </label>
            </div>
            <div className="flex items-center justify-between">
              <select value={duaCategory} onChange={(e) => setDuaCategory(e.target.value)} className="px-4 py-2 rounded-xl bg-[#F1EFEC] border border-[#E6E0D8] text-xs focus:outline-none">
                <option value="عام">عام</option>
                <option value="صحة">صحة</option>
                <option value="نجاح">نجاح</option>
                <option value="هداية">هداية</option>
                <option value="رزق">رزق</option>
              </select>
              <AppButton variant="primary" size="md" icon={<Send className="w-4 h-4" />} onPress={handleSubmitDua}>
                طلب الدعاء
              </AppButton>
            </div>
          </div>

          {/* Duas List */}
          {visibleDuas.length === 0 ? (
            <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-8 text-center text-[#8C7E6E] text-sm">
              {duas.length === 0 ? "لا توجد طلبات دعاء بعد. كن أول من يطلب دعاءً!" : "تم حجب جميع الأدعية. اضغط أيقونة العين لإظهارها."}
            </div>
          ) : (
            visibleDuas.map((dua) => (
              <div key={dua.id} className="rounded-[24px] bg-white border border-[#E6E0D8] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2D241E]">{dua.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#8C7E6E] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(dua.timestamp).toLocaleString("ar-EG")}
                    </span>
                    {dua.deviceFingerprint === device.id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDua(dua.id)}
                        title="حذف الدعاء"
                        className="p-1.5 rounded-lg text-[#C0392B] hover:text-[#A93226] hover:bg-[#FDEDEC] cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleBlock(dua.id)}
                      title="حجب المنشور"
                      className="p-1.5 rounded-lg text-[#8C7E6E] hover:text-[#2D241E] hover:bg-[#F1EFEC] cursor-pointer transition-colors"
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[#2D241E] leading-relaxed font-serif">{dua.duaText}</p>
                <div className="flex items-center justify-between pt-2 border-t border-[#E6E0D8]/50">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F1EFEC] text-[#8C7E6E]">{dua.category}</span>
                  <button type="button" onClick={() => handlePrayForDua(dua.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4E2D5]/40 hover:bg-[#D4E2D5] text-[#2D4232] text-xs font-bold cursor-pointer transition-colors">
                    <Heart className="w-3.5 h-3.5" /> أدعو لك ({dua.prayCount})
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Blocked Duas */}
          {blockedDuas.length > 0 && (
            <div className="rounded-[24px] bg-white border border-dashed border-[#E6E0D8] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#8C7E6E] flex items-center gap-2">
                  <EyeOff className="w-4 h-4" /> الأدعية المحجوبة ({blockedDuas.length})
                </h4>
                <button
                  type="button"
                  onClick={() => blockedDuas.forEach((d) => toggleBlock(d.id))}
                  className="text-[11px] text-[#4A5D4E] font-bold cursor-pointer hover:underline"
                >
                  إظهار الكل
                </button>
              </div>
              <div className="space-y-2">
                {blockedDuas.map((dua) => (
                  <div key={dua.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F9F7F5] border border-[#E6E0D8]">
                    <span className="text-xs font-bold text-[#2D241E] line-clamp-1">{dua.duaText}</span>
                    <button
                      type="button"
                      onClick={() => toggleBlock(dua.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#E6E0D8] text-[#4A5D4E] text-xs font-bold cursor-pointer hover:bg-[#F1EFEC] transition-colors shrink-0"
                    >
                      <EyeOff className="w-3.5 h-3.5" /> إظهار
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KhatmahView;
