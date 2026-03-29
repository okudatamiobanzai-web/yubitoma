export function formatDate(dateStr: string): string {
  // date-only strings (YYYY-MM-DD) are parsed as UTC by default;
  // append T00:00:00 so they are treated as local time instead.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? new Date(dateStr + "T00:00:00")
    : new Date(dateStr);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const now = new Date();
  const isCurrentYear = d.getFullYear() === now.getFullYear();
  if (isCurrentYear) {
    return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
  }
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
}
