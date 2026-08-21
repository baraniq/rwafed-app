import React, { useState, useEffect, useMemo } from "react";
import { DevotionItem } from "../types";
import {
  loadSafinaDuas,
  loadSafinaCategory,
  loadSafinaSahifaData,
  loadHadithKisa,
  SafinaDuaItem,
  SahifaData,
} from "../data/devotionsData";
import { haptic } from "../lib/haptics";
import AppButton from "./AppButton";
import {
  BookMarked,
  Search,
  ChevronLeft,
  Copy,
  Check,
  ArrowRight,
  Heart,
} from "lucide-react";

interface DevotionsViewProps {
  showFeedback: (msg: string) => void;
}

interface MenuSection {
  id: string;
  label: string;
  count: number;
}

const SABINA_CAT_MAP: Record<string, string[]> = {
  sahifa_mohammad: ["s_mhd"],
  sahifa_ali: ["s_ali"],
  sahifa_fatema: ["s_fatema"],
  dua: ["dua"],
  ziyarat: ["zeara"],
  monajat: ["monajat"],
  salawat: ["hojej"],
};

export const DevotionsView: React.FC<DevotionsViewProps> = ({ showFeedback }) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SafinaDuaItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fontSize, setFontSize] = useState<number>(22);
  const [copied, setCopied] = useState<boolean>(false);
  const [loadingDuas, setLoadingDuas] = useState<boolean>(true);
  const [sahifa, setSahifa] = useState<SahifaData | null>(null);
  const [selectedSahifaDua, setSelectedSahifaDua] = useState<number | null>(null);
  const [sahifaFontSize, setSahifaFontSize] = useState<number>(20);
  const [safinaDuas, setSafinaDuas] = useState<SafinaDuaItem[]>([]);
  const [categoryItems, setCategoryItems] = useState<SafinaDuaItem[]>([]);
  const [loadingCategory, setLoadingCategory] = useState<boolean>(false);
  const [hadithKisa, setHadithKisa] = useState<{ title: string; source: string; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      loadSafinaDuas().catch(() => [] as SafinaDuaItem[]),
      loadSafinaSahifaData().catch(() => null),
      loadHadithKisa().catch(() => null),
    ]).then(([safinaItems, sahifaData, kisa]) => {
      setSafinaDuas(safinaItems);
      if (sahifaData && sahifaData.duas.length > 0) setSahifa(sahifaData);
      setHadithKisa(kisa);
      setLoadingDuas(false);
    }).catch(() => setLoadingDuas(false));
  }, []);

  const getMenuSections = (): MenuSection[] => {
    const sMhd = safinaDuas.filter(d => d.safinaCategory === "s_mhd");
    const sAli = safinaDuas.filter(d => d.safinaCategory === "s_ali");
    const sFatema = safinaDuas.filter(d => d.safinaCategory === "s_fatema");
    const duaItems = safinaDuas.filter(d => d.safinaCategory === "dua");
    const ziyaratItems = safinaDuas.filter(d => d.safinaCategory === "zeara");
    const monajatItems = safinaDuas.filter(d => d.safinaCategory === "monajat");
    const hojejItems = safinaDuas.filter(d => d.safinaCategory === "hojej");

    return [
      { id: "sahifa_mohammad", label: "صحيفة الرسول الأكرم (ص)", count: sMhd.length },
      { id: "sahifa_ali", label: "صحيفة الإمام علي (ع)", count: sAli.length },
      { id: "sahifa_fatema", label: "صحيفة السيدة الزهراء (ع)", count: sFatema.length },
      { id: "sahifa_sajjadiyya", label: "الصحيفة السجادية", count: sahifa?.duas.length || 0 },
      { id: "dua", label: "الأدعية", count: duaItems.length },
      { id: "ziyarat", label: "الزيارات", count: ziyaratItems.length },
      { id: "monajat", label: "المناجاة", count: monajatItems.length },
      { id: "salawat", label: "الصلوات على الحجج (ع)", count: hojejItems.length },
      { id: "hadith_kisa", label: "حديث الكساء", count: hadithKisa ? 1 : 0 },
    ];
  };

  const filteredItems = useMemo(() => {
    if (!activeSection) return [];
    const catFilter = SABINA_CAT_MAP[activeSection];
    if (!catFilter) return [];

    const q = searchQuery.trim();
    const items = categoryItems.length > 0 ? categoryItems : safinaDuas.filter(d => catFilter.includes(d.safinaCategory));
    if (!q) return items;
    return items.filter(i => i.titleAr.includes(q) || i.category.includes(q));
  }, [activeSection, categoryItems, safinaDuas, searchQuery]);

  const menuSections = getMenuSections();
  const currentSahifaDua = sahifa?.duas.find((d) => d.number === selectedSahifaDua);

  const openItem = (item: SafinaDuaItem) => {
    haptic.light();
    showFeedback(`فتح ${item.titleAr}`);
    setSelectedItem(item);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    haptic.success();
    showFeedback("تم نسخ النص إلى الحافظة");
    setTimeout(() => setCopied(false), 2000);
  };

  const renderListSection = () => {
    if (!activeSection || activeSection === "sahifa_sajjadiyya" || activeSection === "hadith_kisa") return null;

    const sectionLabel = menuSections.find(s => s.id === activeSection)?.label || "";

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { haptic.light(); setActiveSection(null); setSearchQuery(""); }}
            className="flex items-center gap-2 text-sm text-[#4A5D4E] font-bold cursor-pointer hover:underline"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> رجوع
          </button>
          <h3 className="text-lg font-bold text-[#2D241E] font-serif">{sectionLabel}</h3>
          <span className="text-xs text-[#8C7E6E]">({filteredItems.length})</span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#8C7E6E] absolute right-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث..."
            className="w-full pl-4 pr-11 py-2.5 rounded-2xl bg-[#F1EFEC] border border-[#E6E0D8] text-sm text-[#2D241E] placeholder-[#8C7E6E] focus:outline-none focus:border-[#4A5D4E]"
          />
        </div>

        <div className="space-y-3">
          {loadingCategory ? (
            <div className="text-center py-12 text-[#8C7E6E] text-sm">جاري تحميل...</div>
          ) : (
            filteredItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => openItem(item)}
                className="group p-4 rounded-2xl bg-white border border-[#E6E0D8] hover:border-[#4A5D4E] transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-[#2D241E] group-hover:text-[#4A5D4E] transition-colors font-serif truncate">{item.titleAr}</h4>
                  {item.recommendedTimeAr && <span className="text-[11px] text-[#8C7E6E]">{item.recommendedTimeAr}</span>}
                </div>
                <ChevronLeft className="w-4 h-4 text-[#4A5D4E] shrink-0 group-hover:-translate-x-1 transition-transform" />
              </div>
            ))
          )}
        </div>

        {!loadingCategory && filteredItems.length === 0 && (
          <div className="text-center py-12 text-[#8C7E6E] text-sm">لا توجد نتائج</div>
        )}
      </div>
    );
  };

  const renderSahifaSajjadiyya = () => {
    if (activeSection !== "sahifa_sajjadiyya") return null;
    if (!sahifa) return <div className="text-center py-12 text-[#8C7E6E] text-sm">جاري تحميل الصحيفة السجادية...</div>;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { haptic.light(); setActiveSection(null); }}
            className="flex items-center gap-2 text-sm text-[#4A5D4E] font-bold cursor-pointer hover:underline"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> رجوع
          </button>
          <h3 className="text-lg font-bold text-[#2D241E] font-serif">{sahifa.title}</h3>
        </div>
        <p className="text-sm text-[#4A5D4E] font-semibold text-center">{sahifa.subtitle}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {sahifa.duas.map((dua) => (
            <div key={dua.number} onClick={() => { haptic.light(); setSelectedSahifaDua(dua.number); }} className="p-4 rounded-[20px] bg-white border border-[#E6E0D8] hover:border-[#4A5D4E] cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-[#F1EFEC] text-[#4A5D4E] text-xs font-bold flex items-center justify-center shrink-0">{dua.number}</span>
              <h4 className="text-sm font-bold text-[#2D241E] font-serif leading-snug">{dua.title}</h4>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHadithKisa = () => {
    if (activeSection !== "hadith_kisa") return null;
    if (!hadithKisa) return <div className="text-center py-12 text-[#8C7E6E] text-sm">جاري تحميل حديث الكساء...</div>;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { haptic.light(); setActiveSection(null); }}
            className="flex items-center gap-2 text-sm text-[#4A5D4E] font-bold cursor-pointer hover:underline"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> رجوع
          </button>
          <h3 className="text-lg font-bold text-[#2D241E] font-serif">{hadithKisa.title}</h3>
        </div>
        <div className="flex items-center gap-2 justify-center">
          <span className="px-3 py-1 rounded-full bg-[#D4E2D5] text-[#2D4232] text-[11px] font-bold">{hadithKisa.source}</span>
        </div>
        <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E6E0D8] text-right font-serif leading-loose whitespace-pre-line" style={{ fontSize: `${fontSize}px`, lineHeight: "2.4" }}>
          {hadithKisa.text}
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => handleCopyText(hadithKisa.text)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-[#F1EFEC] text-[#4A5D4E] border border-[#E6E0D8] text-xs font-bold cursor-pointer transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />} {copied ? "تم النسخ" : "نسخ النص"}
          </button>
          <div className="flex items-center rounded-xl bg-white border border-[#E6E0D8] p-0.5">
            <button type="button" onClick={() => setFontSize((s) => Math.max(16, s - 2))} className="px-2 py-1 text-xs text-[#8C7E6E] hover:text-[#2D241E] cursor-pointer font-bold">-A</button>
            <span className="text-xs px-1.5 text-[#4A5D4E] font-bold">{fontSize}</span>
            <button type="button" onClick={() => setFontSize((s) => Math.min(36, s + 2))} className="px-2 py-1 text-xs text-[#8C7E6E] hover:text-[#2D241E] cursor-pointer font-bold">+A</button>
          </div>
        </div>
      </div>
    );
  };

  const renderItemModal = () => {
    if (!selectedItem) return null;
    const text = selectedItem.paragraphs.map(p => p.arabic).filter(Boolean).join("\n\n");

    return (
      <div id="devotion-popup-modal" className="fixed inset-0 z-50 bg-[#F9F7F5] flex flex-col" onClick={() => { setSelectedItem(null); setCopied(false); }}>
        <div className="w-full h-full flex flex-col overflow-hidden animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-[#F9F7F5]">
            <div className="text-center space-y-2 pt-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#D4E2D5] text-[#2D4232] text-[11px] font-bold">{selectedItem.category}</span>
              <h3 className="text-xl font-bold font-serif text-[#2D241E]">{selectedItem.titleAr}</h3>
            </div>
            {selectedItem.virtueAr && (
              <div className="p-4 rounded-2xl bg-[#F9F7F5] border border-[#E6E0D8]">
                <div className="flex items-start gap-2 text-xs text-[#2D4232]">
                  <Heart className="w-4 h-4 text-[#4A5D4E] shrink-0 mt-0.5" />
                  <span><strong>فضل القراءة:</strong> {selectedItem.virtueAr}</span>
                </div>
              </div>
            )}
            <div className="space-y-4 text-right font-serif leading-loose text-[#1A1A1A]">
              {selectedItem.paragraphs.map((p, idx) => (
                <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#E6E0D8]/70 hover:border-[#D4CEBE] transition-colors whitespace-pre-line" style={{ fontSize: `${fontSize}px`, lineHeight: "2.4" }}>
                  {p.arabic}
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border-t border-[#E6E0D8] bg-white flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => handleCopyText(text)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F1EFEC] text-[#4A5D4E] border border-[#E6E0D8] text-xs font-bold cursor-pointer transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />} <span className="hidden sm:inline">{copied ? "تم النسخ" : "نسخ"}</span>
              </button>
              <div className="flex items-center rounded-xl bg-white border border-[#E6E0D8] p-0.5">
                <button type="button" onClick={() => setFontSize((s) => Math.max(16, s - 2))} className="px-2 py-1 text-xs text-[#8C7E6E] hover:text-[#2D241E] cursor-pointer font-bold">-A</button>
                <span className="text-xs px-1.5 text-[#4A5D4E] font-bold">{fontSize}</span>
                <button type="button" onClick={() => setFontSize((s) => Math.min(36, s + 2))} className="px-2 py-1 text-xs text-[#8C7E6E] hover:text-[#2D241E] cursor-pointer font-bold">+A</button>
              </div>
            </div>
            <AppButton variant="primary" size="sm" onPress={() => { setSelectedItem(null); setCopied(false); haptic.light(); }}>إغلاق</AppButton>
          </div>
        </div>
      </div>
    );
  };

  const renderSahifaModal = () => {
    if (selectedSahifaDua === null || !currentSahifaDua) return null;

    return (
      <div id="sahifa-popup-modal" className="fixed inset-0 z-50 bg-[#F9F7F5] flex flex-col" onClick={() => { setSelectedSahifaDua(null); setCopied(false); }}>
        <div className="w-full h-full flex flex-col overflow-hidden animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-[#F9F7F5]">
            <div className="text-center space-y-2 pt-2 pb-5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#D4E2D5] text-[#2D4232] text-[11px] font-bold">الصحيفة السجادية - الدعاء رقم {currentSahifaDua.number}</span>
              <h3 className="text-xl font-bold font-serif text-[#2D241E]">{currentSahifaDua.title}</h3>
            </div>
            <div className="text-right font-serif leading-loose text-[#1A1A1A]">
              <div className="p-4 sm:p-6 rounded-2xl bg-white border border-[#E6E0D8]/70 hover:border-[#D4CEBE] transition-colors whitespace-pre-line" style={{ fontSize: `${sahifaFontSize}px`, lineHeight: "2.4" }}>
                {currentSahifaDua.text}
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-[#E6E0D8] bg-white flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { navigator.clipboard.writeText(currentSahifaDua.text); setCopied(true); haptic.success(); showFeedback("تم النسخ"); setTimeout(() => setCopied(false), 2000); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F1EFEC] text-[#4A5D4E] border border-[#E6E0D8] text-xs font-bold cursor-pointer transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />} <span className="hidden sm:inline">{copied ? "تم النسخ" : "نسخ"}</span>
              </button>
              <div className="flex items-center rounded-xl bg-white border border-[#E6E0D8] p-0.5">
                <button type="button" onClick={() => setSahifaFontSize((s) => Math.max(16, s - 2))} className="px-2 py-1 text-xs text-[#8C7E6E] hover:text-[#2D241E] cursor-pointer font-bold">-A</button>
                <span className="text-xs px-1.5 text-[#4A5D4E] font-bold">{sahifaFontSize}</span>
                <button type="button" onClick={() => setSahifaFontSize((s) => Math.min(36, s + 2))} className="px-2 py-1 text-xs text-[#8C7E6E] hover:text-[#2D241E] cursor-pointer font-bold">+A</button>
              </div>
            </div>
            <AppButton variant="primary" size="sm" onPress={() => { setSelectedSahifaDua(null); setCopied(false); haptic.light(); }}>إغلاق</AppButton>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="devotions-container" className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="rounded-[32px] bg-white border border-[#E6E0D8] p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-[#F1EFEC] text-[#4A5D4E] flex items-center justify-center font-bold">
            <BookMarked className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-[#2D241E] font-serif">الأدعية والزيارات المأثورة</h2>
            <p className="text-xs text-[#8C7E6E]">
              {loadingDuas ? "جاري تحميل الأدعية..." : `${safinaDuas.length} دعاء وزيارة`}
            </p>
          </div>
        </div>
      </div>

      {!activeSection && (
        <div className="space-y-3">
          {menuSections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                haptic.light();
                if (section.count > 0) {
                  setActiveSection(section.id);
                  setSearchQuery("");
                  const cat = SABINA_CAT_MAP[section.id];
                  if (cat) {
                    setLoadingCategory(true);
                    setCategoryItems([]);
                    Promise.all(cat.map(c => loadSafinaCategory(c))).then(results => {
                      setCategoryItems(results.flat());
                      setLoadingCategory(false);
                    }).catch(() => setLoadingCategory(false));
                  }
                } else {
                  showFeedback("لا توجد بيانات متاحة حالياً");
                }
              }}
              className="w-full flex items-center justify-between p-5 rounded-[24px] bg-white border border-[#E6E0D8] hover:border-[#4A5D4E] transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-[#4A5D4E] text-white text-xs font-bold flex items-center justify-center">{section.count}</span>
                <h3 className="text-base font-bold text-[#2D241E] font-serif">{section.label}</h3>
              </div>
              <ChevronLeft className="w-5 h-5 text-[#8C7E6E]" />
            </button>
          ))}
        </div>
      )}

      {renderListSection()}
      {renderSahifaSajjadiyya()}
      {renderHadithKisa()}
      {renderItemModal()}
      {renderSahifaModal()}
    </div>
  );
};

export default DevotionsView;
