import { ref, set } from "firebase/database";
import { db } from "../src/lib/firebase";

async function setupUpdate() {
  await set(ref(db, "appUpdate/latestVersion"), {
    version: "1.1.0",
    message: "تم تحسين أداء المجيب الذكي وثبات التطبيق.",
    downloadUrl: "https://example.com/download.apk",
  });
  console.log("Update info set in Firebase!");
  process.exit(0);
}

setupUpdate().catch(console.error);
