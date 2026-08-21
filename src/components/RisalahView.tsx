import React, { useState, useEffect, useRef } from "react";
import { haptic } from "../lib/haptics";
import { loadRisalahIndex, loadRisalahBook, RisalahAuthor, RisalahBook } from "../data/devotionsData";
import { BookOpen, ChevronLeft, ChevronRight, Search, ArrowRight, Minus, Plus } from "lucide-react";

interface Props {
  showFeedback: (msg: string) => void;
}

export function RisalahView({ showFeedback }: Props) {
  const [authors, setAuthors] = useState<RisalahAuthor[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<number | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [book, setBook] = useState<RisalahBook | null>(null);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookLoading, setBookLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRisalahIndex().then((data) => {
      setAuthors(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedBookId) return;
    setBookLoading(true);
    setBook(null);
    setSelectedSection(null);
    loadRisalahBook(selectedBookId).then((b) => {
      setBook(b);
      setBookLoading(false);
    });
  }, [selectedBookId]);

  const currentAuthor = authors.find((a) => a.authorId === selectedAuthor);
  const filteredSections = book?.sections?.filter(
    (s) =>
      !searchQuery ||
      s.title.includes(searchQuery) ||
      s.body.includes(searchQuery)
  ) || [];

  const handleBack = () => {
    if (selectedSection !== null) {
      setSelectedSection(null);
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else if (selectedBookId) {
      setSelectedBookId(null);
      setBook(null);
      setSelectedSection(null);
    } else if (selectedAuthor !== null) {
      setSelectedAuthor(null);
    }
    haptic.light();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-2 border-[#4A5D4E] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#8C7E6E] mt-3">جاري تحميل الرسائل الفقهية...</p>
        </div>
      </div>
    );
  }

  const totalSections = authors.reduce((sum, a) => sum + a.books.reduce((s, b) => s + b.sectionsCount, 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(selectedAuthor !== null || selectedBookId) && (
            <button type="button" onClick={handleBack} className="p-2 rounded-xl text-[#8C7E6E] hover:bg-[#F1EFEC] transition-colors cursor-pointer">
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-black font-serif">
              {selectedAuthor !== null ? (currentAuthor?.authorName || "الرسائل") : "الرسائل الفقهية"}
            </h2>
            <p className="text-[10px] text-[#8C7E6E] mt-0.5">
              {selectedBookId && book
                ? `${book.sections?.length || 0} مسألة`
                : selectedAuthor !== null
                ? `${currentAuthor?.books.length || 0} كتب`
                : `${authors.length} مرجع - ${totalSections} مسألة`}
            </p>
          </div>
        </div>
        <span className="text-xs text-[#8C7E6E] bg-[#F1EFEC] px-3 py-1 rounded-full">
          {selectedBookId && book ? `${book.title}` : "فقه"}
        </span>
      </div>

      {/* Authors Grid */}
      {selectedAuthor === null && !selectedBookId && (
        <div className="space-y-2">
          {authors.map((author) => {
            const totalBooks = author.books.length;
            const totalSections = author.books.reduce((s, b) => s + b.sectionsCount, 0);
            return (
              <button
                key={author.authorId}
                type="button"
                onClick={() => { setSelectedAuthor(author.authorId); haptic.light(); }}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white border border-[#E6E0D8] hover:border-[#4A5D4E] hover:shadow-md transition-all text-right cursor-pointer group"
              >
                <span className="shrink-0 w-10 h-10 rounded-xl bg-[#4A5D4E]/10 text-[#4A5D4E] flex items-center justify-center text-sm font-bold group-hover:bg-[#4A5D4E] group-hover:text-white transition-colors">
                  {totalBooks}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-black group-hover:text-[#4A5D4E] transition-colors truncate">
                    {author.authorName}
                  </p>
                  <p className="text-[10px] text-[#8C7E6E]">
                    {totalBooks} كتب - {totalSections} مسألة
                  </p>
                </div>
                <ChevronLeft className="w-4 h-4 text-[#8C7E6E] group-hover:text-[#4A5D4E] transition-colors" />
              </button>
            );
          })}
        </div>
      )}

      {/* Books Grid */}
      {selectedAuthor !== null && !selectedBookId && currentAuthor && (
        <div className="space-y-2">
          {currentAuthor.books.map((bk) => (
            <button
              key={bk.id}
              type="button"
              onClick={() => { setSelectedBookId(bk.id); haptic.light(); }}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white border border-[#E6E0D8] hover:border-[#4A5D4E] hover:shadow-md transition-all text-right cursor-pointer group"
            >
              <span className="shrink-0 w-10 h-10 rounded-xl bg-[#8C7E6E]/10 text-[#8C7E6E] flex items-center justify-center group-hover:bg-[#8C7E6E] group-hover:text-white transition-colors">
                <BookOpen className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-black group-hover:text-[#4A5D4E] transition-colors truncate">
                  {bk.title}
                </p>
                <p className="text-[10px] text-[#8C7E6E]">{bk.sectionsCount} مسألة</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-[#8C7E6E] group-hover:text-[#4A5D4E] transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* Book Loading */}
      {bookLoading && (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-2 border-[#4A5D4E] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#8C7E6E] mt-3">جاري تحميل الكتاب...</p>
        </div>
      )}

      {/* Sections List */}
      {selectedBookId && book && !bookLoading && selectedSection === null && (
        <div className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2 bg-[#F1EFEC] rounded-2xl px-4 py-3">
            <Search className="w-4 h-4 text-[#8C7E6E] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في المسائل..."
              className="flex-1 bg-transparent text-sm text-black placeholder:text-[#8C7E6E]/60 outline-none text-right"
              dir="rtl"
            />
          </div>
          {/* Sections */}
          <div className="space-y-1.5">
            {filteredSections.map((section, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => { setSelectedSection(idx); haptic.light(); }}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white border border-[#E6E0D8] hover:border-[#4A5D4E] transition-all text-right cursor-pointer group"
              >
                <span className="shrink-0 w-7 h-7 rounded-lg bg-[#F1EFEC] text-[#8C7E6E] text-[10px] font-bold flex items-center justify-center group-hover:bg-[#D4E2D5] group-hover:text-[#4A5D4E] transition-colors">
                  {idx + 1}
                </span>
                <p className="flex-1 text-xs font-bold text-black group-hover:text-[#4A5D4E] transition-colors truncate">
                  {section.title}
                </p>
                <ChevronLeft className="w-3.5 h-3.5 text-[#8C7E6E] group-hover:text-[#4A5D4E] transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section Content */}
      {selectedBookId && book && selectedSection !== null && book.sections?.[selectedSection] && (
        <div ref={contentRef} className="space-y-4">
          <div className="flex items-center justify-between bg-[#F1EFEC] rounded-2xl px-4 py-2.5">
            <span className="text-xs font-bold text-black">
              {selectedSection + 1} / {filteredSections.length}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setFontSize((s) => Math.max(12, s - 1))} className="w-7 h-7 rounded-lg bg-white border border-[#E6E0D8] text-[#8C7E6E] flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-[10px] font-bold text-[#8C7E6E] w-8 text-center">{fontSize}px</span>
              <button type="button" onClick={() => setFontSize((s) => Math.min(28, s + 1))} className="w-7 h-7 rounded-lg bg-white border border-[#E6E0D8] text-[#8C7E6E] flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-black font-serif leading-relaxed">
            {book.sections[selectedSection].title}
          </h3>

          {/* Body */}
          <div
            className="text-[#3D3229] leading-[2] whitespace-pre-wrap text-justify"
            style={{ fontSize: `${fontSize}px` }}
          >
            {book.sections[selectedSection].body.split("\n").filter((p) => p.trim()).map((paragraph, pIdx) => (
              <p key={pIdx} className="mb-3">
                {paragraph.trim()}
              </p>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E6E0D8]">
            <button
              type="button"
              onClick={() => { setSelectedSection(Math.max(0, selectedSection - 1)); haptic.light(); contentRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }}
              disabled={selectedSection === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F1EFEC] text-[#8C7E6E] text-xs font-bold disabled:opacity-40 cursor-pointer disabled:cursor-default transition-all hover:bg-[#E6E0D8]"
            >
              <ChevronRight className="w-4 h-4" />
              السابق
            </button>
            <span className="text-[10px] text-[#8C7E6E]">
              {selectedSection + 1} / {filteredSections.length}
            </span>
            <button
              type="button"
              onClick={() => { setSelectedSection(Math.min(filteredSections.length - 1, selectedSection + 1)); haptic.light(); contentRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }}
              disabled={selectedSection >= filteredSections.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F1EFEC] text-[#8C7E6E] text-xs font-bold disabled:opacity-40 cursor-pointer disabled:cursor-default transition-all hover:bg-[#E6E0D8]"
            >
              التالي
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
