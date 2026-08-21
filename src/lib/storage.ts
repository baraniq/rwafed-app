import { QadaState, ReflectionChecklist, IstikharaHistoryItem } from "../types";

const STORAGE_PREFIX = "naseem_";

function getKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

function getItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(getKey(key));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(getKey(key), JSON.stringify(value));
}

export async function getTasbeeh(): Promise<number> {
  return getItem<number>("tasbeeh") || 0;
}

export async function saveTasbeeh(count: number): Promise<void> {
  setItem("tasbeeh", count);
}

export async function getQada(): Promise<QadaState> {
  return getItem<QadaState>("qada") || {
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
    fasting: 0,
  };
}

export async function saveQada(qada: QadaState): Promise<void> {
  setItem("qada", qada);
}

export async function getReflection(): Promise<ReflectionChecklist> {
  return getItem<ReflectionChecklist>("reflection") || {
    fajrOnTime: false,
    dhuhrAsrOnTime: false,
    maghribIshaOnTime: false,
    quranRead: false,
    tasbeehDone: false,
    charityOrHelp: false,
    tongueGuarded: false,
    parentsRespect: false,
    notes: "",
    date: new Date().toISOString().split("T")[0],
  };
}

export async function saveReflection(reflection: ReflectionChecklist): Promise<void> {
  setItem("reflection", reflection);
}

export async function getIstikharaHistory(): Promise<IstikharaHistoryItem[]> {
  return getItem<IstikharaHistoryItem[]>("istikhara_history") || [];
}

export async function addIstikharaHistory(
  purpose: string,
  pageNumber: number,
  entry: any
): Promise<IstikharaHistoryItem[]> {
  const history = await getIstikharaHistory();
  const newItem: IstikharaHistoryItem = {
    id: `ikh_${Date.now()}`,
    purpose,
    pageNumber,
    entry,
    timestamp: new Date().toISOString(),
  };
  history.unshift(newItem);
  setItem("istikhara_history", history);
  return history;
}

export async function clearIstikharaHistory(): Promise<void> {
  setItem("istikhara_history", []);
}

export function getBookmarks(): Record<number, string> {
  return getItem<Record<number, string>>("bookmarks") || {};
}

export function saveBookmark(pageNumber: number, label: string): void {
  const bookmarks = getBookmarks();
  bookmarks[pageNumber] = label;
  setItem("bookmarks", bookmarks);
}

export function removeBookmark(pageNumber: number): void {
  const bookmarks = getBookmarks();
  delete bookmarks[pageNumber];
  setItem("bookmarks", bookmarks);
}

export function getNotes(): Record<number, string> {
  return getItem<Record<number, string>>("notes") || {};
}

export function saveNote(pageNumber: number, text: string): void {
  const notes = getNotes();
  notes[pageNumber] = text;
  setItem("notes", notes);
}

export interface AyahBookmark {
  id: string;
  surah: number;
  ayah: number;
  page: number;
  date: string;
}

export interface WordBookmark {
  id: string;
  word: string;
  surah: number;
  ayah: number;
  index: number;
  page: number;
  date: string;
}

export function getAyahBookmarks(): AyahBookmark[] {
  return getItem<AyahBookmark[]>("ayah_bookmarks") || [];
}

export function addAyahBookmark(surah: number, ayah: number, page: number): boolean {
  const list = getAyahBookmarks();
  if (list.some((b) => b.surah === surah && b.ayah === ayah)) return false;
  list.unshift({ id: `ab_${surah}_${ayah}`, surah, ayah, page, date: new Date().toISOString() });
  setItem("ayah_bookmarks", list);
  return true;
}

export function removeAyahBookmark(surah: number, ayah: number): void {
  setItem("ayah_bookmarks", getAyahBookmarks().filter((b) => !(b.surah === surah && b.ayah === ayah)));
}

export function hasAyahBookmark(surah: number, ayah: number): boolean {
  return getAyahBookmarks().some((b) => b.surah === surah && b.ayah === ayah);
}

export function getAyahNotes(): Record<string, string> {
  return getItem<Record<string, string>>("ayah_notes") || {};
}

export function saveAyahNote(surah: number, ayah: number, text: string): void {
  const notes = getAyahNotes();
  notes[`${surah}:${ayah}`] = text;
  setItem("ayah_notes", notes);
}

export function getWordBookmarks(): WordBookmark[] {
  return getItem<WordBookmark[]>("word_bookmarks") || [];
}

export function addWordBookmark(word: string, surah: number, ayah: number, index: number, page: number): boolean {
  const list = getWordBookmarks();
  if (list.some((b) => b.surah === surah && b.ayah === ayah && b.index === index)) return false;
  list.unshift({ id: `wb_${surah}_${ayah}_${index}`, word, surah, ayah, index, page, date: new Date().toISOString() });
  setItem("word_bookmarks", list);
  return true;
}

export function removeWordBookmark(surah: number, ayah: number, index: number): void {
  setItem("word_bookmarks", getWordBookmarks().filter((b) => !(b.surah === surah && b.ayah === ayah && b.index === index)));
}
