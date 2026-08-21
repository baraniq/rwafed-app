import { createRequire } from "module";
import fs from "fs";

const require = createRequire(import.meta.url);
const sqlite3 = require("sqlite3");

const DB_PATH = process.argv[2];
const OUT_PATH = process.argv[3];

if (!DB_PATH || !OUT_PATH) {
  console.error("Usage: node export-quran.js <dbPath> <outJsonPath>");
  process.exit(1);
}

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY);

db.all(
  "SELECT id, Sora as idSurah, AyeNumb as ayahNumber, text as originalText, simpleMinimal, searchText1, Page as pageNumber, Hizb as hizbNumber, Juz as juzNumber FROM quran_ayats ORDER BY id",
  (err, rows) => {
    if (err) {
      console.error("Query error:", err.message);
      db.close();
      process.exit(1);
    }
    const data = rows.map((r) => ({
      id: r.id,
      idSurah: r.idSurah,
      ayahNumber: r.ayahNumber,
      originalText: r.originalText,
      simpleMinimal: r.simpleMinimal || r.originalText,
      searchText1: r.searchText1 || "",
      pageNumber: r.pageNumber,
      hizbNumber: r.hizbNumber,
      juzNumber: r.juzNumber,
    }));
    fs.writeFileSync(OUT_PATH, JSON.stringify(data), "utf8");
    console.log("Exported", data.length, "ayahs to", OUT_PATH);
    db.close();
  }
);
