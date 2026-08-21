// Copies the azan mp3 files from public/audio into the Android raw resources
// directory so the native notification channel can play them as ringtones.
// Run after `npm run build` and before `npx cap sync android`.
import { copyFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const srcDir = join(root, "public", "audio");
const androidRaw = join(root, "android", "app", "src", "main", "res", "raw");

if (!existsSync(srcDir)) {
  console.error("public/audio not found. Run this after copying azan files.");
  process.exit(1);
}

mkdirSync(androidRaw, { recursive: true });

let copied = 0;
for (const file of readdirSync(srcDir)) {
  if (!/\.mp3$/i.test(file)) continue;
  const base = file.replace(/\.mp3$/i, "");
  if (!/^[a-z0-9_]+$/i.test(base)) {
    console.warn(`Skipping ${file}: filename must be lowercase alphanumeric/underscore for Android resources.`);
    continue;
  }
  copyFileSync(join(srcDir, file), join(androidRaw, file));
  copied++;
}

console.log(`Copied ${copied} azan audio file(s) to android/app/src/main/res/raw`);
