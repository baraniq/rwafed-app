import fs from "fs";

const csvPath = "public/data/ayah.csv";
const outPath = "public/data/quran_ayats.json";

const raw = fs.readFileSync(csvPath);

// UTF-16 LE BOM check
if (raw[0] === 0xFF && raw[1] === 0xFE) {
  console.log("UTF-16 LE BOM detected");
} else {
  console.log("No BOM, treating as UTF-8");
}

// Convert bytes to string using TextDecoder (more reliable than .toString)
const decoder = new TextDecoder("utf-16le");
const csv = decoder.decode(raw.slice(2));

const lines = csv.split(/\r?\n/).filter((l) => l.trim());
console.log("Lines:", lines.length);
console.log("Sample:", lines[1].substring(0, 100));

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

const data = lines.slice(1).map((line) => {
  const cols = parseCSVLine(line);
  return {
    id: parseInt(cols[0]),
    idSurah: parseInt(cols[1]),
    ayahNumber: parseInt(cols[2]),
    originalText: cols[3] || "",
    simpleMinimal: cols[4] || cols[3] || "",
    searchText1: cols[5] || "",
    pageNumber: parseInt(cols[6]),
    hizbNumber: parseInt(cols[7]),
    juzNumber: parseInt(cols[8]),
  };
});

// Write with TextEncoder (proper UTF-8)
const encoder = new TextEncoder();
const jsonStr = JSON.stringify(data);
const jsonBytes = encoder.encode(jsonStr);
fs.writeFileSync(outPath, jsonBytes);

// Verify by reading back
const verifyBuf = fs.readFileSync(outPath);
const verifyDecoder = new TextDecoder("utf-8");
const verifyStr = verifyDecoder.decode(verifyBuf);
const verifyData = JSON.parse(verifyStr);
console.log("Verified:", verifyData.length, "ayahs");
console.log("Text:", verifyData[0].originalText.substring(0, 40));
console.log("Search:", verifyData[0].searchText1);
console.log("File size:", jsonBytes.length, "bytes");
