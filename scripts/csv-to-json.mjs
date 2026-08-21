import fs from "fs";

const csvPath = process.argv[2];
const outPath = process.argv[3];

if (!csvPath || !outPath) {
  console.error("Usage: node csv-to-json.js <csvPath> <outJsonPath>");
  process.exit(1);
}

const raw = fs.readFileSync(csvPath);
let csv;
// Detect and handle UTF-16 LE BOM
if (raw[0] === 0xFF && raw[1] === 0xFE) {
  csv = raw.toString("utf16le");
} else {
  csv = raw.toString("utf8");
}
const lines = csv.split("\n").filter((l) => l.trim());
const header = lines[0];
const dataLines = lines.slice(1);

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

const data = dataLines.map((line) => {
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

fs.writeFileSync(outPath, JSON.stringify(data), "utf8");
console.log("Converted", data.length, "ayahs from CSV to JSON");
