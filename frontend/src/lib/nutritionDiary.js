export const MEAL_ORDER = {
  kahvalti: 0,
  ara_ogun: 1,
  ogle: 2,
  aksam: 3,
  gece: 4,
};

export function mealDateKey(record) {
  const raw = record?.date ?? record?.createdAt;
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function groupRecordsByDate(records) {
  const groups = new Map();
  for (const r of records || []) {
    const key = mealDateKey(r);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  const keys = [...groups.keys()].sort((a, b) => b.localeCompare(a));
  return keys.map((dateKey) => ({
    dateKey,
    items: [...groups.get(dateKey)].sort(
      (a, b) =>
        (MEAL_ORDER[a.mealType] ?? 99) - (MEAL_ORDER[b.mealType] ?? 99) ||
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),
  }));
}

export function formatDiaryDayTitle(dateKey) {
  const parts = dateKey.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return dateKey;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
