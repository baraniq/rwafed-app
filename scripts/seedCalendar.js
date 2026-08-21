import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_URL =
  "https://nsem-320eb-default-rtdb.asia-southeast1.firebasedatabase.app";

const file = path.join(__dirname, "..", "public", "data", "daily-calendar", "calendar.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));

async function put(pathName, body) {
  const res = await fetch(`${DB_URL}${pathName}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${pathName} -> ${res.status} ${await res.text()}`);
  return res.json();
}

(async () => {
  for (const day of data.days) {
    const dateKey = day.date;
    if (!dateKey) {
      console.log("SKIP (no date field):", day.weekday);
      continue;
    }
    const { date, ...entry } = day;
    await put(`/dailyCalendar/${dateKey}`, entry);
    console.log("SEEDED", dateKey, "-", day.weekday);
  }
  console.log("DONE");
})().catch((e) => {
  console.error("ERROR", e);
  process.exit(1);
});
