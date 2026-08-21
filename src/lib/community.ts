import { Khatma, KhatmaPart, DuaRequest } from "../types";
import { db } from "./firebase";
import {
  ref,
  get,
  set,
  update,
  remove,
  onValue,
  off,
  DataSnapshot,
} from "firebase/database";

function getDeviceId(): string {
  let id = localStorage.getItem("naseem_device_id");
  if (!id) {
    id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("naseem_device_id", id);
  }
  return id;
}

export function getDeviceProfile() {
  return {
    id: getDeviceId(),
    name: `مستخدم_${getDeviceId().slice(-4)}`,
  };
}

function partsToArray(khatma: any): KhatmaPart[] {
  if (Array.isArray(khatma.parts)) return khatma.parts;
  if (khatma.parts && typeof khatma.parts === "object") {
    const parts: KhatmaPart[] = [];
    for (const key of Object.keys(khatma.parts)) {
      const p = khatma.parts[key];
      parts.push({
        id: p.id || `${khatma.id}_part_${p.partNumber}`,
        khatmaId: khatma.id,
        partNumber: p.partNumber,
        status: p.status || "available",
        reservedBy: p.reservedBy,
        completedAt: p.completedAt,
      });
    }
    return parts.sort((a, b) => a.partNumber - b.partNumber);
  }
  return [];
}

function rawToKhatma(raw: any): Khatma {
  return {
    id: raw.id,
    name: raw.name || "ختمة جماعية",
    createdAt: raw.createdAt || "",
    totalParts: raw.totalParts || (raw.parts ? Object.keys(raw.parts).length : 30),
    parts: partsToArray(raw),
    ownerFingerprint: raw.ownerFingerprint,
    ownerName: raw.ownerName,
  };
}

function rawToDua(raw: any): DuaRequest {
  return {
    id: raw.id,
    name: raw.name || "مجهول",
    duaText: raw.duaText || "",
    category: raw.category || "عام",
    timestamp: raw.timestamp || "",
    anonymous: !!raw.anonymous,
    deviceFingerprint: raw.deviceFingerprint || "",
    prayCount: raw.prayCount || 0,
  };
}

// --- Real-time subscriptions ---

export function subscribeKhatmahs(callback: (khatmahs: Khatma[]) => void): () => void {
  const khatmahsRef = ref(db, "khatmahs");
  const handler = (snapshot: DataSnapshot) => {
    const val = snapshot.val();
    if (!val) return callback([]);
    const list = Object.values(val)
      .map(rawToKhatma)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    callback(list);
  };
  onValue(khatmahsRef, handler);
  return () => off(khatmahsRef, "value", handler);
}

export function subscribeDuas(callback: (duas: DuaRequest[]) => void): () => void {
  const duasRef = ref(db, "duas");
  const handler = (snapshot: DataSnapshot) => {
    const val = snapshot.val();
    if (!val) return callback([]);
    const list = Object.values(val)
      .map(rawToDua)
      .sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
    callback(list);
  };
  onValue(duasRef, handler);
  return () => off(duasRef, "value", handler);
}

// --- Khatmah CRUD ---

export async function fetchKhatmahs(): Promise<Khatma[]> {
  const snap = await get(ref(db, "khatmahs"));
  const val = snap.val();
  if (!val) return [];
  return Object.values(val)
    .map(rawToKhatma)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function createKhatmah(name: string, totalParts: number): Promise<Khatma> {
  const device = getDeviceProfile();
  const id = `khatma_${Date.now()}`;
  const createdAt = new Date().toISOString();
  const parts: Record<number, any> = {};
  const count = Math.max(1, Math.min(30, totalParts || 30));
  for (let i = 1; i <= count; i++) {
    parts[i] = { partNumber: i, status: "available" };
  }
  const data = {
    id,
    name: name || "ختمة جماعية",
    createdAt,
    totalParts: count,
    ownerFingerprint: device.id,
    ownerName: device.name,
    parts,
  };
  await set(ref(db, `khatmahs/${id}`), data);

  // Broadcast to all users (except the author, filtered in-app)
  await pushNotification({
    type: "new_khatmah",
    message: `🕌 ختمة جديدة "${data.name}" انشأها ${device.name}. شارك بقراءة جزء!`,
    broadcast: true,
    authorFingerprint: device.id,
    khatmaId: id,
  });

  return rawToKhatma(data);
}

export async function reservePart(khatmaId: string, partNumber: number): Promise<KhatmaPart> {
  const device = getDeviceProfile();
  await update(ref(db, `khatmahs/${khatmaId}/parts/${partNumber}`), {
    status: "reserved",
    reservedBy: device.name,
    reservedAt: new Date().toISOString(),
  });

  // Notify the khatmah owner
  try {
    const snap = await get(ref(db, `khatmahs/${khatmaId}`));
    const khatma = snap.val();
    if (khatma && khatma.ownerFingerprint && khatma.ownerFingerprint !== device.id) {
      await pushNotification({
        type: "part_reserved",
        message: `📖 اختار ${device.name} الجزء ${partNumber} من ختمتك "${khatma.name}".`,
        targetDevice: khatma.ownerFingerprint,
        khatmaId,
      });
    }
  } catch (e) {
    console.error("reserve notify error", e);
  }

  return { id: `${khatmaId}_part_${partNumber}`, khatmaId, partNumber, status: "reserved", reservedBy: device.name };
}

export async function completePart(khatmaId: string, partNumber: number): Promise<KhatmaPart> {
  await update(ref(db, `khatmahs/${khatmaId}/parts/${partNumber}`), {
    status: "completed",
    completedAt: new Date().toISOString(),
  });
  return { id: `${khatmaId}_part_${partNumber}`, khatmaId, partNumber, status: "completed" };
}

/** Delete a khatmah. Only the owner (matching ownerFingerprint) may delete it. */
export async function deleteKhatmah(khatmaId: string): Promise<boolean> {
  const device = getDeviceProfile();
  const snap = await get(ref(db, `khatmahs/${khatmaId}`));
  const val = snap.val();
  if (!val) return false;
  if (val.ownerFingerprint && val.ownerFingerprint !== device.id) return false;
  await remove(ref(db, `khatmahs/${khatmaId}`));
  return true;
}

// --- Dua Requests ---

export async function fetchDuaRequests(): Promise<DuaRequest[]> {
  const snap = await get(ref(db, "duas"));
  const val = snap.val();
  if (!val) return [];
  return Object.values(val)
    .map(rawToDua)
    .sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
}

export async function submitDuaRequest(
  name: string,
  duaText: string,
  category: string,
  anonymous: boolean
): Promise<DuaRequest> {
  const device = getDeviceProfile();
  const id = `dua_${Date.now()}`;
  const dua = {
    id,
    name: anonymous ? "مجهول" : name || "مجهول",
    duaText,
    category: category || "عام",
    timestamp: new Date().toISOString(),
    anonymous,
    deviceFingerprint: device.id,
    prayCount: 0,
  };
  await set(ref(db, `duas/${id}`), dua);

  // Broadcast to all users (except the author, filtered in-app)
  await pushNotification({
    type: "new_dua",
    message: `💚 دعاء جديد من ${dua.name}: "${duaText.length > 40 ? duaText.slice(0, 40) + "..." : duaText}". أدعُ له!`,
    broadcast: true,
    authorFingerprint: device.id,
    duaId: id,
  });

  return rawToDua(dua);
}

export async function prayForDua(duaId: string): Promise<DuaRequest> {
  const duaRef = ref(db, `duas/${duaId}`);
  const snap = await get(duaRef);
  const val = snap.val();
  if (!val) throw new Error("Dua not found");
  const newCount = (val.prayCount || 0) + 1;
  await update(duaRef, { prayCount: newCount });

  // Notify the dua owner
  const device = getDeviceProfile();
  try {
    if (val.deviceFingerprint && val.deviceFingerprint !== device.id) {
      await pushNotification({
        type: "dua_prayed",
        message: `🤲 ${device.name} صلى/دعا من أجل دعائك! (إجمالي ${newCount})`,
        targetDevice: val.deviceFingerprint,
        duaId,
      });
    }
  } catch (e) {
    console.error("pray notify error", e);
  }

  return rawToDua({ ...val, prayCount: newCount });
}

/** Delete a dua request. Only the author (matching deviceFingerprint) may delete it. */
export async function deleteDuaRequest(duaId: string): Promise<boolean> {
  const device = getDeviceProfile();
  const snap = await get(ref(db, `duas/${duaId}`));
  const val = snap.val();
  if (!val) return false;
  if (val.deviceFingerprint && val.deviceFingerprint !== device.id) return false;
  await remove(ref(db, `duas/${duaId}`));
  return true;
}

// --- Notifications ---

export interface AppNotification {
  id: string;
  type: "new_khatmah" | "new_dua" | "part_reserved" | "dua_prayed";
  message: string;
  timestamp: string;
  // broadcast = true for all users; otherwise target specific device
  broadcast?: boolean;
  targetDevice?: string;
  // author of the broadcast (so the author doesn't get their own broadcast)
  authorFingerprint?: string;
  khatmaId?: string;
  duaId?: string;
  read?: boolean;
}

export async function subscribeNotifications(
  callback: (notifications: AppNotification[]) => void
): Promise<() => void> {
  const notificationsRef = ref(db, "notifications");
  const handler = (snapshot: DataSnapshot) => {
    const val = snapshot.val();
    if (!val) return callback([]);
    const list = Object.values(val)
      .map((raw: any) => raw as AppNotification)
      .sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
    callback(list);
  };
  onValue(notificationsRef, handler);
  return () => off(notificationsRef, "value", handler);
}

async function pushNotification(n: Omit<AppNotification, "id" | "timestamp">) {
  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const notif: AppNotification = {
    ...n,
    id,
    timestamp: new Date().toISOString(),
    read: false,
  };
  await set(ref(db, `notifications/${id}`), notif);
  return notif;
}

export async function markNotificationRead(id: string): Promise<void> {
  await update(ref(db, `notifications/${id}`), { read: true });
}

export async function clearNotifications(): Promise<void> {
  await remove(ref(db, "notifications"));
}

export async function clearAllCommunityData(): Promise<void> {
  await remove(ref(db, "khatmahs"));
  await remove(ref(db, "duas"));
  await remove(ref(db, "notifications"));
}

export { getDeviceId };