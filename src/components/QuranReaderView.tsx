import React, { useState, useEffect, useCallback, useRef } from "react";
import { QuranAyah } from "../types";
import { surahs, getAyahsByPage, getSurahStartPage, searchAyahs, preLoadAllAyahs } from "../data/quranData";
import { tafseerSources, getAyahTafseer } from "../data/tafseerData";
import { getBookmarks, saveBookmark, removeBookmark, addAyahBookmark, removeAyahBookmark, hasAyahBookmark, getAyahNotes, saveAyahNote, addWordBookmark, removeWordBookmark, getAyahBookmarks, getWordBookmarks, AyahBookmark, WordBookmark } from "../lib/storage";
import { Modal } from "./Modal";
import { haptic } from "../lib/haptics";
import AppButton from "./AppButton";
import {
  Bookmark,
  BookmarkCheck,
  FileText,
  Image,
  List,
  Search,
  ZoomIn,
  ZoomOut,
  X,
  BookOpen,
  Copy,
  Check,
  Plus,
  Minus,
  Share2,
  StickyNote,
  Star,
} from "lucide-react";

interface IrabWord {
  t: string;
  tr: string;
  en: string;
}

interface IrabWordHit {
  word: IrabWord;
  surah: number;
  ayahNumber: number;
  index: number;
  ayah: QuranAyah | null;
}

interface QuranReaderViewProps {
  showFeedback: (msg: string) => void;
}

export const QuranReaderView: React.FC<QuranReaderViewProps> = ({ showFeedback }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [ayahs, setAyahs] = useState<QuranAyah[]>([]);
  const [viewMode, setViewMode] = useState<"image" | "text">("image");
  const [bookmarks, setBookmarks] = useState<Record<number, string>>({});
  const [showSurahList, setShowSurahList] = useState<boolean>(false);
  const [showBookmarksList, setShowBookmarksList] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearchPanel, setShowSearchPanel] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [searchResults, setSearchResults] = useState<QuranAyah[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);  const [imageZoom, setImageZoom] = useState<number>(100);

  const [irabData, setIrabData] = useState<Record<string, IrabWord[]>>({});
  const [irabHit, setIrabHit] = useState<IrabWordHit | null>(null);
  const [irabHitSaved, setIrabHitSaved] = useState<boolean>(false);
  const [irabHitCopied, setIrabHitCopied] = useState<boolean>(false);
  const [loadingIrab, setLoadingIrab] = useState<boolean>(false);
  const [irabLoaded, setIrabLoaded] = useState<boolean>(false);

  const [glyphs, setGlyphs] = useState<Record<string, number[][]> | null>(null);

  // Ayah action modal (copy ayah + open tafseer)
  const [selectedAyahModal, setSelectedAyahModal] = useState<QuranAyah | null>(null);
  const [copiedAyah, setCopiedAyah] = useState<boolean>(false);
  const [ayahBookmarked, setAyahBookmarked] = useState<boolean>(false);
  const [ayahNoteInput, setAyahNoteInput] = useState<string>("");
  const [ayahBookmarksList, setAyahBookmarksList] = useState<AyahBookmark[]>([]);
  const [wordBookmarksList, setWordBookmarksList] = useState<WordBookmark[]>([]);

  // Tafseer modal (choose source + view + font size + copy)
  const [tafseerModalOpen, setTafseerModalOpen] = useState<boolean>(false);
  const [tafseerModalSource, setTafseerModalSource] = useState<string>("mizan");
  const [tafseerModalText, setTafseerModalText] = useState<string>("");
  const [tafseerModalLoading, setTafseerModalLoading] = useState<boolean>(false);
  const [tafseerFontSize, setTafseerFontSize] = useState<number>(16);
  const [tafseerCopied, setTafseerCopied] = useState<boolean>(false);
  const [tafseerModalAyah, setTafseerModalAyah] = useState<QuranAyah | null>(null);

  // Page ayahs list (image mode tap)
  const [showPageAyahs, setShowPageAyahs] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const TOTAL_PAGES = 604;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    // Require a horizontal swipe (more horizontal than vertical) with enough distance
    const THRESHOLD = 60;
    if (Math.abs(dx) < THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;

    if (dx > 0) {
      // Swipe right (left -> right) => next page
      if (currentPage < TOTAL_PAGES) { setCurrentPage(currentPage + 1); haptic.light(); }
    } else {
      // Swipe left (right -> left) => previous page
      if (currentPage > 1) { setCurrentPage(currentPage - 1); haptic.light(); }
    }
  };

  useEffect(() => {
    setBookmarks(getBookmarks());
  }, []);

  useEffect(() => {
    const loadAyahs = async () => {
      try {
        const result = await getAyahsByPage(currentPage);
        setAyahs(result);
      } catch {
        setAyahs([]);
      }
    };
    loadAyahs();
  }, [currentPage]);

  const loadIrabData = async () => {
    if (irabLoaded) return;
    setLoadingIrab(true);
    try {
      const res = await fetch("/data/irab/words.json");
      const data = await res.json();
      setIrabData(data);
      setIrabLoaded(true);
    } catch {
      console.error("Failed to load irab data");
    } finally {
      setLoadingIrab(false);
    }
  };

  const loadGlyphs = async () => {
    if (glyphs) return;
    try {
      const res = await fetch("/data/irab/glyphs.json");
      const data = await res.json();
      setGlyphs(data.pages || {});
    } catch {
      console.error("Failed to load glyph data");
    }
  };

  useEffect(() => {
    loadGlyphs();
    loadIrabData();
    preLoadAllAyahs();
  }, []);

  useEffect(() => {
    if (selectedAyahModal) {
      setAyahBookmarked(hasAyahBookmark(selectedAyahModal.idSurah, selectedAyahModal.ayahNumber));
      setAyahNoteInput(getAyahNotes()[`${selectedAyahModal.idSurah}:${selectedAyahModal.ayahNumber}`] || "");
    }
  }, [selectedAyahModal]);

  const toggleBookmark = useCallback(() => {
    if (bookmarks[currentPage]) {
      removeBookmark(currentPage);
      setBookmarks(getBookmarks());
      haptic.light();
      showFeedback("تم إزالة العلامة");
    } else {
      saveBookmark(currentPage, `صفحة ${currentPage}`);
      setBookmarks(getBookmarks());
      haptic.success();
      showFeedback("تم حفظ العلامة");
    }
  }, [currentPage, bookmarks, showFeedback]);

  const openIrabHit = (hit: IrabWordHit) => {
    setIrabHitSaved(
      getWordBookmarks().some((b) => b.surah === hit.surah && b.ayah === hit.ayahNumber && b.index === hit.index)
    );
    setIrabHitCopied(false);
    setIrabHit(hit);
  };

  const handleWordTap = (word: IrabWord, ayah: QuranAyah, index: number) => {
    haptic.light();
    openIrabHit({ word, surah: ayah.idSurah, ayahNumber: ayah.ayahNumber, index, ayah });
  };

  const handleImageTap = (e: React.MouseEvent<HTMLImageElement>) => {
    haptic.light();
    if (!glyphs) {
      loadGlyphs();
      if (ayahs.length > 0) setShowPageAyahs(true);
      return;
    }
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      if (ayahs.length > 0) setShowPageAyahs(true);
      return;
    }
    const x = (e.clientX - rect.left) * (1080 / rect.width);
    const y = (e.clientY - rect.top) * (1714 / rect.height);

    const pageEntries = glyphs[String(currentPage)] || [];
    let best: { idAyah: number; gi: number; x1: number; x2: number } | null = null;
    let bestArea = Infinity;
    for (const [idAyah, x1, y1, x2, y2, gi] of pageEntries) {
      if (x >= x1 - 10 && x <= x2 + 10 && y >= y1 - 8 && y <= y2 + 8) {
        const area = (x2 - x1) * (y2 - y1);
        if (area < bestArea) {
          bestArea = area;
          best = { idAyah, gi, x1, x2 };
        }
      }
    }

    if (!best) {
      if (ayahs.length > 0) setShowPageAyahs(true);
      return;
    }

    const ayah = ayahs.find((a) => a.id === best!.idAyah);
    if (!ayah) {
      if (ayahs.length > 0) setShowPageAyahs(true);
      return;
    }

    const words = irabData[`${ayah.idSurah}:${ayah.ayahNumber}`];
    if (words && words.length > 0) {
      const segs = pageEntries
        .filter((en) => en[0] === best!.idAyah)
        .sort((a, b) => a[5] - b[5]);
      const nSeg = segs.length;
      const n = words.length;
      const counts = segs.map((_, i) => Math.round((n * (i + 1)) / nSeg) - Math.round((n * i) / nSeg));
      const k = Math.max(0, segs.findIndex((s) => s[5] === best!.gi));
      const wordStart = counts.slice(0, k).reduce((a, b) => a + b, 0);
      const wordCount = counts[k] || 0;
      if (wordCount > 0) {
        const segWords = words.slice(wordStart, wordStart + wordCount);
        const totalLen = segWords.reduce((acc, w) => acc + w.t.length + 1, 0);
        let fromRight = 0;
        let hitIndex = 0;
        for (let j = 0; j < wordCount; j++) {
          fromRight += segWords[j].t.length + 1;
          const boundary = best!.x2 - (fromRight / totalLen) * (best!.x2 - best!.x1);
          if (x >= boundary) {
            hitIndex = j;
            break;
          }
        }
        const idx = wordStart + hitIndex;
        const w = words[idx];
        if (w) {
          openIrabHit({ word: w, surah: ayah.idSurah, ayahNumber: ayah.ayahNumber, index: idx, ayah });
          return;
        }
      }
    }

    openAyahModal(ayah);
  };

  const copyText = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      haptic.success();
      return true;
    } catch {
      return false;
    }
  };

  const openAyahModal = (ayah: QuranAyah) => {
    haptic.light();
    setCopiedAyah(false);
    setSelectedAyahModal(ayah);
  };

  const closeAyahModal = () => {
    setSelectedAyahModal(null);
    setCopiedAyah(false);
  };

  const copyAyahText = async (ayah: QuranAyah) => {
    const text = ayah.originalText || ayah.simpleMinimal || "";
    const ok = await copyText(text);
    if (ok) {
      setCopiedAyah(true);
      setTimeout(() => setCopiedAyah(false), 2000);
    }
  };

  const toggleAyahBookmark = () => {
    if (!selectedAyahModal) return;
    if (ayahBookmarked) {
      removeAyahBookmark(selectedAyahModal.idSurah, selectedAyahModal.ayahNumber);
      setAyahBookmarked(false);
      haptic.light();
      showFeedback("تم إزالة علامة الآية");
    } else {
      addAyahBookmark(selectedAyahModal.idSurah, selectedAyahModal.ayahNumber, selectedAyahModal.pageNumber);
      setAyahBookmarked(true);
      haptic.success();
      showFeedback("تم حفظ علامة الآية");
    }
  };

  const saveNoteForAyah = () => {
    if (!selectedAyahModal) return;
    saveAyahNote(selectedAyahModal.idSurah, selectedAyahModal.ayahNumber, ayahNoteInput);
    haptic.success();
    showFeedback("تم حفظ الملاحظة");
  };

  const shareAyah = async (ayah: QuranAyah) => {
    const surahName = surahs.find((s) => s.id === ayah.idSurah)?.name || "";
    const text = `${ayah.originalText || ayah.simpleMinimal}\n(${surahName} ${ayah.ayahNumber})`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch {
      /* المستخدم ألغى المشاركة */
    }
    const ok = await copyText(text);
    if (ok) showFeedback("تم نسخ الآية للمشاركة");
  };

  const toggleWordBookmark = () => {
    if (!irabHit) return;
    const added = addWordBookmark(irabHit.word.t, irabHit.surah, irabHit.ayahNumber, irabHit.index, irabHit.ayah?.pageNumber || currentPage);
    if (added) {
      setIrabHitSaved(true);
      haptic.success();
      showFeedback("تم حفظ الكلمة");
    } else {
      removeWordBookmark(irabHit.surah, irabHit.ayahNumber, irabHit.index);
      setIrabHitSaved(false);
      haptic.light();
      showFeedback("تم إزالة الكلمة المحفوظة");
    }
  };

  const copyIrabHit = async () => {
    if (!irabHit) return;
    const text = `${irabHit.word.t}\nالنحو: ${irabHit.word.tr}\nالمعنى: ${irabHit.word.en}`;
    const ok = await copyText(text);
    if (ok) {
      setIrabHitCopied(true);
      setTimeout(() => setIrabHitCopied(false), 2000);
    }
  };

  const openTafseerModal = async (ayah: QuranAyah) => {
    haptic.light();
    setTafseerModalAyah(ayah);
    setTafseerModalOpen(true);
    setTafseerFontSize(16);
    setTafseerCopied(false);
    await loadTafseerForAyah(ayah, tafseerModalSource);
  };

  const loadTafseerForAyah = async (ayah: QuranAyah, sourceId: string) => {
    setTafseerModalLoading(true);
    setTafseerModalText("");
    try {
      const text = await getAyahTafseer(ayah.idSurah, ayah.ayahNumber, sourceId, ayah.pageNumber);
      setTafseerModalText(text);
    } catch {
      setTafseerModalText("حدث خطأ في تحميل التفسير");
    } finally {
      setTafseerModalLoading(false);
    }
  };

  const changeTafseerSource = async (sourceId: string) => {
    setTafseerModalSource(sourceId);
    if (tafseerModalAyah) {
      await loadTafseerForAyah(tafseerModalAyah, sourceId);
    }
  };

  const copyTafseerText = async () => {
    const ok = await copyText(tafseerModalText);
    if (ok) {
      setTafseerCopied(true);
      setTimeout(() => setTafseerCopied(false), 2000);
    }
  };

  const closeTafseerModal = () => {
    setTafseerModalOpen(false);
    setTafseerModalAyah(null);
    setTafseerModalText("");
  };

  const currentSurahsOnPage = ayahs.length > 0
    ? [...new Set(ayahs.map((a) => a.idSurah))].map((id) => surahs.find((s) => s.id === id)).filter(Boolean)
    : [];

  const goToSurah = async (idSurah: number) => {
    haptic.light();
    setShowSurahList(false);
    const page = await getSurahStartPage(idSurah);
    setCurrentPage(page);
    setViewMode("image");
  };

  const handleSearchTextChange = (value: string) => {
    setSearchText(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!value.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      handleSearchInternal(value);
    }, 300);
  };

  const handleSearchInternal = async (q: string) => {
    if (!q.trim()) return;
    setSearchLoading(true);
    setHasSearched(true);
    haptic.light();
    try {
      const results = await searchAyahs(q.trim());
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const highlightText = (ayah: QuranAyah, query: string): React.ReactNode => {
    const text = ayah.originalText || ayah.simpleMinimal || "";
    if (!query.trim() || !text) return text;
    const q = query.trim();

    // Find which search field matches to determine highlight positions
    const searchFields = [ayah.searchText1, ayah.searchText2, ayah.searchText3].filter(Boolean);
    let matchedField = "";
    for (const field of searchFields) {
      if (field.includes(q)) { matchedField = field; break; }
    }

    // If we found a match in a search field, find the position and highlight in originalText
    if (matchedField) {
      const matchIdx = matchedField.indexOf(q);
      if (matchIdx >= 0) {
        // Calculate approximate character ratio between search field and original text
        const ratio = text.length / matchedField.length;
        const approxStart = Math.floor(matchIdx * ratio);
        const approxEnd = Math.floor((matchIdx + q.length) * ratio);

        // Find best match region in original text
        const before = text.substring(0, approxStart);
        const region = text.substring(approxStart, Math.min(approxEnd + 5, text.length));
        const after = text.substring(Math.min(approxEnd + 5, text.length));

        return (
          <>
            {before}
            <span className="bg-[#D4E2D5] text-[#2D4232] font-bold px-0.5 rounded">{region}</span>
            {after}
          </>
        );
      }
    }

    // Fallback: direct text match
    const parts = text.split(q);
    if (parts.length === 1) return text;
    return (
      <>
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i < parts.length - 1 && (
              <span className="bg-[#D4E2D5] text-[#2D4232] font-bold px-0.5 rounded">{q}</span>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  const goToSearchResult = async (ayah: QuranAyah) => {
    haptic.light();
    setShowSearchPanel(false);
    setCurrentPage(ayah.pageNumber);
    setViewMode("text");
  };

  return (
    <div id="quran-reader-container" className="space-y-4 pb-12 -mx-4">
      {/* Top Controls Bar */}
      <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-3 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <AppButton variant="ghost" size="sm" icon={<List className="w-4 h-4" />} onPress={() => { setShowSurahList(!showSurahList); setShowBookmarksList(false); setShowSearchPanel(false); }}>
              الفهرس
            </AppButton>
            <AppButton variant="ghost" size="sm" icon={<Bookmark className="w-4 h-4" />} onPress={() => {
              const next = !showBookmarksList;
              setShowBookmarksList(next);
              setShowSurahList(false);
              setShowSearchPanel(false);
              if (next) {
                setAyahBookmarksList(getAyahBookmarks());
                setWordBookmarksList(getWordBookmarks());
              }
            }}>
              ({Object.keys(bookmarks).length + ayahBookmarksList.length + wordBookmarksList.length})
            </AppButton>
            <AppButton variant="ghost" size="sm" icon={<Search className="w-4 h-4" />} onPress={() => {
              const next = !showSearchPanel;
              setShowSearchPanel(next);
              setShowSurahList(false);
              setShowBookmarksList(false);
              if (!next) {
                setSearchResults([]);
                setSearchText("");
                setHasSearched(false);
              }
            }}>
              بحث
            </AppButton>
          </div>

          <div className="text-center flex-1">
            <span className="text-sm font-bold text-[#2D241E] font-serif">صفحة {currentPage}</span>
            {currentSurahsOnPage.length > 0 && (
              <span className="text-[10px] text-[#8C7E6E] block">
                {currentSurahsOnPage.map((s) => s!.name).join(" - ")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button type="button" onClick={() => { setViewMode("image"); haptic.light(); }} className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === "image" ? "bg-[#4A5D4E] text-white" : "text-[#8C7E6E] hover:bg-[#F1EFEC]"}`} title="عرض صورة المصحف">
              <Image className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => { setViewMode("text"); haptic.light(); }} className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === "text" ? "bg-[#4A5D4E] text-white" : "text-[#8C7E6E] hover:bg-[#F1EFEC]"}`} title="عرض النص">
              <FileText className="w-4 h-4" />
            </button>
            <button type="button" onClick={toggleBookmark} className={`p-2 rounded-xl transition-all cursor-pointer ${bookmarks[currentPage] ? "text-[#4A5D4E]" : "text-[#8C7E6E] hover:bg-[#F1EFEC]"}`} title="علامة">
              {bookmarks[currentPage] ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Surah List Drawer */}
      {showSurahList && (
        <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-4 shadow-xs max-h-80 overflow-y-auto">
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-[#8C7E6E] absolute right-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث عن سورة..." className="w-full pl-4 pr-10 py-2 rounded-xl bg-[#F1EFEC] border border-[#E6E0D8] text-xs focus:outline-none focus:border-[#4A5D4E]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
            {surahs.filter((s) => !searchQuery || s.name.includes(searchQuery) || s.englishName.toLowerCase().includes(searchQuery.toLowerCase())).map((surah) => (
              <button key={surah.id} type="button" onClick={() => { goToSurah(surah.id); }} className="flex items-center gap-2 p-2 hover:bg-[#F1EFEC] rounded-xl cursor-pointer text-right transition-colors">
                <span className="w-7 h-7 rounded-lg bg-[#F1EFEC] border border-[#E6E0D8] text-[10px] font-bold text-[#4A5D4E] flex items-center justify-center shrink-0">{surah.id}</span>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#2D241E] block truncate">{surah.name}</span>
                  <span className="text-[9px] text-[#8C7E6E]">{surah.ayahCount} آية</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bookmarks List */}
      {showBookmarksList && (
        <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-4 shadow-xs max-h-96 overflow-y-auto space-y-4">
          <h3 className="text-xs font-bold text-[#2D241E]">العلامات المحفوظة:</h3>

          <div>
            <span className="text-[10px] font-bold text-[#8C7E6E]">صفحات المصحف:</span>
            {Object.entries(bookmarks).length === 0 ? (
              <p className="text-xs text-[#8C7E6E] py-2">لا توجد علامات صفحات</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
                {Object.entries(bookmarks).sort(([a], [b]) => Number(a) - Number(b)).map(([page]) => (
                  <button key={page} type="button" onClick={() => { setCurrentPage(parseInt(page)); setShowBookmarksList(false); haptic.light(); }} className="p-2 rounded-xl bg-[#F1EFEC] border border-[#E6E0D8] text-xs font-bold text-[#4A5D4E] hover:bg-[#D4E2D5] cursor-pointer text-center transition-colors">
                    ص {page}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#8C7E6E]">الآيات:</span>
            {ayahBookmarksList.length === 0 ? (
              <p className="text-xs text-[#8C7E6E] py-2">لا توجد علامات آيات</p>
            ) : (
              <div className="space-y-1.5 mt-2">
                {ayahBookmarksList.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-2 rounded-xl bg-[#F1EFEC] border border-[#E6E0D8]">
                    <button type="button" onClick={() => { setCurrentPage(b.page); setShowBookmarksList(false); haptic.light(); }} className="text-xs font-bold text-[#4A5D4E] cursor-pointer hover:underline text-right flex-1">
                      {surahs.find((s) => s.id === b.surah)?.name || `سورة ${b.surah}`} - آية {b.ayah}
                    </button>
                    <button type="button" onClick={() => { removeAyahBookmark(b.surah, b.ayah); setAyahBookmarksList(getAyahBookmarks()); haptic.light(); }} className="p-1 rounded-lg text-[#8C7E6E] hover:text-rose-600 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#8C7E6E]">الكلمات المحفوظة:</span>
            {wordBookmarksList.length === 0 ? (
              <p className="text-xs text-[#8C7E6E] py-2">لا توجد كلمات محفوظة</p>
            ) : (
              <div className="space-y-1.5 mt-2">
                {wordBookmarksList.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-2 rounded-xl bg-[#F1EFEC] border border-[#E6E0D8]">
                    <button type="button" onClick={() => { setCurrentPage(b.page); setShowBookmarksList(false); haptic.light(); }} className="text-xs font-bold text-[#4A5D4E] cursor-pointer hover:underline text-right flex-1">
                      {b.word} <span className="text-[#8C7E6E] font-normal">({surahs.find((s) => s.id === b.surah)?.name || `سورة ${b.surah}`} {b.ayah})</span>
                    </button>
                    <button type="button" onClick={() => { removeWordBookmark(b.surah, b.ayah, b.index); setWordBookmarksList(getWordBookmarks()); haptic.light(); }} className="p-1 rounded-lg text-[#8C7E6E] hover:text-rose-600 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Panel */}
      {showSearchPanel && (
        <div className="rounded-[24px] bg-white border border-[#E6E0D8] p-4 shadow-xs">
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-[#8C7E6E] absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => handleSearchTextChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); handleSearchInternal(searchText); } }}
              placeholder="ابحث في آيات القرآن..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F1EFEC] border border-[#E6E0D8] text-sm focus:outline-none focus:border-[#4A5D4E]"
            />
            {searchText && (
              <button type="button" onClick={() => { setSearchText(""); setSearchResults([]); setHasSearched(false); }} className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-[#8C7E6E] hover:text-[#2D241E] cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); handleSearchInternal(searchText); }}
            disabled={!searchText.trim() || searchLoading}
            className="w-full py-2.5 rounded-xl bg-[#4A5D4E] text-white text-sm font-bold cursor-pointer hover:bg-[#3d4d40] transition-colors disabled:opacity-50"
          >
            {searchLoading ? "جاري البحث..." : "بحث"}
          </button>

          {hasSearched && !searchLoading && (
            <div className="mt-3">
              <p className="text-[10px] text-[#8C7E6E] mb-2">
                {searchResults.length > 0
                  ? `وجدنا ${searchResults.length} نتيجة`
                  : "لم نجد نتائج مطابقة"}
              </p>
              {searchResults.length > 0 && (
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {searchResults.map((ayah) => (
                    <button
                      key={ayah.id}
                      type="button"
                      onClick={() => goToSearchResult(ayah)}
                      className="w-full text-right p-3 rounded-xl bg-[#F9F7F5] border border-[#E6E0D8] hover:bg-[#F1EFEC] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-[#4A5D4E] bg-[#D4E2D5] px-2 py-0.5 rounded-lg">
                          {surahs.find((s) => s.id === ayah.idSurah)?.name} - آية {ayah.ayahNumber}
                        </span>
                        <span className="text-[10px] text-[#8C7E6E]">صفحة {ayah.pageNumber}</span>
                      </div>
                      <p className="text-base font-serif text-[#1A1A1A] leading-[2] line-clamp-2">
                        {highlightText(ayah, searchText)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div ref={scrollRef} className="rounded-[24px] bg-white border border-[#E6E0D8] shadow-xs overflow-hidden">
        {viewMode === "image" ? (
          /* IMAGE MODE - Mushaf Page (full screen, proportional zoom) */
          <div className="relative">
            <div className="flex items-center justify-center bg-[#2D241E] p-2 gap-2 sticky top-0 z-10">
              <button type="button" onClick={() => setImageZoom(Math.max(100, imageZoom - 20))} className="p-1 rounded text-white/70 hover:text-white cursor-pointer"><ZoomOut className="w-4 h-4" /></button>
              <span className="text-[10px] text-white/50">{imageZoom}%</span>
              <button type="button" onClick={() => setImageZoom(Math.min(400, imageZoom + 20))} className="p-1 rounded text-white/70 hover:text-white cursor-pointer"><ZoomIn className="w-4 h-4" /></button>
              <button type="button" onClick={() => setImageZoom(100)} className="p-1 px-2 rounded text-[10px] text-white/70 hover:text-white hover:bg-white/10 cursor-pointer">ملء الشاشة</button>
            </div>
            <div
              className="w-full h-[calc(100vh-140px)] overflow-auto bg-[#F9F7F5] flex justify-center"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={`/quran-pages/ar-${String(currentPage).padStart(3, "0")}.png`}
                alt={`صفحة ${currentPage}`}
                className="max-w-none shrink-0 transition-transform duration-200 quran-page-img"
                style={{ transform: `scale(${imageZoom / 100})`, transformOrigin: "top center" }}
                onClick={handleImageTap}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  setViewMode("text");
                }}
              />
            </div>
          </div>
        ) : (
          /* TEXT MODE - Ayah Text with Irab */
          <div className="p-5 sm:p-8 space-y-4" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {ayahs.length === 0 ? (
              <div className="text-center py-12 text-[#8C7E6E] text-sm">جاري تحميل الآيات...</div>
            ) : (
              ayahs.map((ayah) => {
                const irabKey = `${ayah.idSurah}:${ayah.ayahNumber}`;
                const words = irabData[irabKey];

                return (
                  <div key={ayah.id} className="border-b border-[#E6E0D8]/40 pb-4 last:border-0">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => openAyahModal(ayah)}
                        className="shrink-0 w-9 h-9 rounded-full bg-[#F1EFEC] border border-[#E6E0D8] text-[10px] font-bold text-[#4A5D4E] flex items-center justify-center hover:bg-[#D4E2D5] transition-colors cursor-pointer"
                        title="اضغط لعرض الآية والتفسير"
                      >
                        {ayah.ayahNumber}
                      </button>
                      <div className="flex-1 min-w-0" onClick={() => openAyahModal(ayah)}>
                        {words && words.length > 0 ? (
                          <p className="text-xl sm:text-2xl font-serif text-[#1A1A1A] leading-[2.5] text-right cursor-pointer">
                            {words.map((w, i) => (
                              <span
                                key={i}
                                onClick={(e) => { e.stopPropagation(); handleWordTap(w, ayah, i); }}
                                className="cursor-pointer hover:bg-[#D4E2D5] hover:rounded px-0.5 transition-colors inline-block"
                                title={`${w.tr} - ${w.en}`}
                              >
                                {w.t}
                              </span>
                            ))}
                            <span className="text-[#4A5D4E] text-base mr-1 opacity-80"> ﴿{ayah.ayahNumber}﴾ </span>
                          </p>
                        ) : (
                          <p className="text-xl sm:text-2xl font-serif text-[#1A1A1A] leading-[2.5] text-right cursor-pointer">
                            {ayah.simpleMinimal || ayah.originalText}
                            <span className="text-[#4A5D4E] text-base mr-1 opacity-80"> ﴿{ayah.ayahNumber}﴾ </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Page Ayahs List (image mode) */}
      <Modal visible={showPageAyahs} onClose={() => setShowPageAyahs(false)} title={`آيات الصفحة ${currentPage}`}>
        <div className="p-4 space-y-3">
          {ayahs.length === 0 ? (
            <div className="text-center py-8 text-[#8C7E6E] text-sm">جاري تحميل الآيات...</div>
          ) : (
            ayahs.map((ayah) => (
              <div key={ayah.id} className="rounded-2xl bg-[#F9F7F5] border border-[#E6E0D8] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-[#4A5D4E] bg-[#D4E2D5] px-2 py-0.5 rounded-lg">
                    {surahs.find((s) => s.id === ayah.idSurah)?.name} - آية {ayah.ayahNumber}
                  </span>
                  <button type="button" onClick={() => { setShowPageAyahs(false); openAyahModal(ayah); }} className="text-[10px] font-bold text-[#4A5D4E] hover:underline cursor-pointer">
                    عرض الآية
                  </button>
                </div>
                <p className="text-lg font-serif text-[#1A1A1A] leading-[2.2] text-right">
                  {ayah.originalText || ayah.simpleMinimal}
                </p>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Ayah Action Modal (copy + tafseer) */}
      <Modal visible={!!selectedAyahModal} onClose={closeAyahModal} title={selectedAyahModal ? `${surahs.find((s) => s.id === selectedAyahModal.idSurah)?.name} - آية ${selectedAyahModal.ayahNumber}` : ""}>
        {selectedAyahModal && (
          <div className="p-5 space-y-4">
            <p className="text-2xl font-serif text-[#1A1A1A] leading-[2.5] text-right">
              {selectedAyahModal.originalText || selectedAyahModal.simpleMinimal}
              <span className="text-[#4A5D4E] text-base mr-1 opacity-80"> ﴿{selectedAyahModal.ayahNumber}﴾ </span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => copyAyahText(selectedAyahModal)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#4A5D4E] text-white text-sm font-bold cursor-pointer hover:bg-[#3d4d40] transition-colors"
              >
                {copiedAyah ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedAyah ? "تم النسخ" : "نسخ الآية"}
              </button>
              <button
                type="button"
                onClick={() => { closeAyahModal(); openTafseerModal(selectedAyahModal); }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#F1EFEC] text-[#4A5D4E] text-sm font-bold cursor-pointer hover:bg-[#E6E0D8] transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                تفسير الآية
              </button>
              <button
                type="button"
                onClick={toggleAyahBookmark}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold cursor-pointer transition-colors ${ayahBookmarked ? "bg-[#D4E2D5] text-[#2D4232]" : "bg-[#F1EFEC] text-[#4A5D4E] hover:bg-[#E6E0D8]"}`}
              >
                {ayahBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                {ayahBookmarked ? "علامة الآية ✓" : "علامة للآية"}
              </button>
              <button
                type="button"
                onClick={() => shareAyah(selectedAyahModal)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#F1EFEC] text-[#4A5D4E] text-sm font-bold cursor-pointer hover:bg-[#E6E0D8] transition-colors"
              >
                <Share2 className="w-4 h-4" />
                مشاركة
              </button>
            </div>
            <div className="rounded-2xl bg-[#F9F7F5] border border-[#E6E0D8] p-3 space-y-2">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#2D241E]">
                <StickyNote className="w-3.5 h-3.5 text-[#4A5D4E]" />
                ملاحظتي على الآية:
              </label>
              <textarea
                rows={2}
                value={ayahNoteInput}
                onChange={(e) => setAyahNoteInput(e.target.value)}
                placeholder="اكتب ملاحظتك على هذه الآية..."
                className="w-full p-3 rounded-xl bg-white border border-[#E6E0D8] text-xs focus:outline-none focus:border-[#4A5D4E]"
              />
              <div className="flex justify-end">
                <AppButton variant="primary" size="sm" onPress={saveNoteForAyah}>حفظ الملاحظة</AppButton>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Tafseer Modal (choose source + view + font size + copy) */}
      <Modal visible={tafseerModalOpen && !!tafseerModalAyah} onClose={closeTafseerModal} title={tafseerModalAyah ? `تفسير ${surahs.find((s) => s.id === tafseerModalAyah.idSurah)?.name} - آية ${tafseerModalAyah.ayahNumber}` : ""}>
        {tafseerModalAyah && (
          <div className="flex flex-col h-full">
            {/* Source selector */}
            <div className="p-4 border-b border-[#E6E0D8] shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-[#8C7E6E] font-bold shrink-0">اختر التفسير:</span>
                {tafseerSources.map((src) => (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => changeTafseerSource(src.id)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${tafseerModalSource === src.id ? "bg-[#4A5D4E] text-white" : "bg-[#F1EFEC] text-[#8C7E6E] hover:bg-[#E6E0D8]"}`}
                  >
                    {src.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {tafseerModalLoading ? (
                <div className="text-center py-10 text-[#8C7E6E] text-sm">جاري تحميل التفسير...</div>
              ) : (
                <div className="whitespace-pre-wrap font-serif text-[#2D241E] leading-[2.2]" style={{ fontSize: `${tafseerFontSize}px` }}>
                  {tafseerModalText}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[#E6E0D8] shrink-0 flex items-center gap-2">
              <div className="flex items-center rounded-xl bg-white border border-[#E6E0D8] p-0.5 shrink-0">
                <button type="button" onClick={() => setTafseerFontSize(Math.max(12, tafseerFontSize - 2))} className="px-2 py-1 text-xs text-[#8C7E6E] hover:text-[#2D241E] cursor-pointer font-bold">-A</button>
                <span className="text-xs px-1.5 text-[#4A5D4E] font-bold">{tafseerFontSize}</span>
                <button type="button" onClick={() => setTafseerFontSize(Math.min(32, tafseerFontSize + 2))} className="px-2 py-1 text-xs text-[#8C7E6E] hover:text-[#2D241E] cursor-pointer font-bold">+A</button>
              </div>
              <button
                type="button"
                onClick={copyTafseerText}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#4A5D4E] text-white text-sm font-bold cursor-pointer hover:bg-[#3d4d40] transition-colors"
              >
                {tafseerCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {tafseerCopied ? "تم نسخ التفسير" : "نسخ نص التفسير"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Irab Word Popup */}
      <Modal visible={!!irabHit} onClose={() => setIrabHit(null)} title={irabHit ? irabHit.word.t : ""}>
        {irabHit && (
          <div className="p-5 space-y-3">
            <div className="text-right">
              {irabHit.ayah && (
                <span className="text-[10px] text-[#8C7E6E] block">
                  {surahs.find((s) => s.id === irabHit.ayah!.idSurah)?.name} - آية {irabHit.ayahNumber}
                </span>
              )}
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F1EFEC]">
              <span className="text-[10px] font-bold text-[#8C7E6E] w-12 shrink-0">النحو:</span>
              <span className="text-sm font-bold text-[#2D241E] font-serif">{irabHit.word.tr}</span>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F1EFEC]">
              <span className="text-[10px] font-bold text-[#8C7E6E] w-12 shrink-0">المعنى:</span>
              <span className="text-sm text-[#2D241E]">{irabHit.word.en}</span>
            </div>
            {loadingIrab && (
              <p className="text-[10px] text-[#8C7E6E] text-center">جاري تحميل بيانات الإعراب...</p>
            )}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={toggleWordBookmark}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-2xl text-[11px] font-bold cursor-pointer transition-colors ${irabHitSaved ? "bg-[#D4E2D5] text-[#2D4232]" : "bg-[#F1EFEC] text-[#4A5D4E] hover:bg-[#E6E0D8]"}`}
              >
                <Star className={`w-4 h-4 ${irabHitSaved ? "fill-[#4A5D4E]" : ""}`} />
                {irabHitSaved ? "محفوظة" : "حفظ"}
              </button>
              <button
                type="button"
                onClick={copyIrabHit}
                className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-2xl bg-[#F1EFEC] text-[#4A5D4E] text-[11px] font-bold cursor-pointer hover:bg-[#E6E0D8] transition-colors"
              >
                {irabHitCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {irabHitCopied ? "تم النسخ" : "نسخ"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const a = irabHit.ayah;
                  setIrabHit(null);
                  if (a) openAyahModal(a);
                }}
                disabled={!irabHit.ayah}
                className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-2xl bg-[#F1EFEC] text-[#4A5D4E] text-[11px] font-bold cursor-pointer hover:bg-[#E6E0D8] transition-colors disabled:opacity-40"
              >
                <BookOpen className="w-4 h-4" />
                الآية
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default QuranReaderView;
