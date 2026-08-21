import { ref, get } from "firebase/database";
import { db } from "./firebase";

export const APP_VERSION = "1.1.0";

export interface UpdateInfo {
  version: string;
  message: string;
  downloadUrl: string;
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const snap = await get(ref(db, "appUpdate/latestVersion"));
    if (!snap.exists()) return null;
    const data = snap.val() as UpdateInfo;
    if (data.version && isNewer(data.version, APP_VERSION)) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

function isNewer(remote: string, local: string): boolean {
  const r = remote.split(".").map(Number);
  const l = local.split(".").map(Number);
  for (let i = 0; i < Math.max(r.length, l.length); i++) {
    const rv = r[i] || 0;
    const lv = l[i] || 0;
    if (rv > lv) return true;
    if (rv < lv) return false;
  }
  return false;
}
