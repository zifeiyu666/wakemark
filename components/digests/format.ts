const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT = MONTHS_LONG.map((month) => month.slice(0, 3));

function parseWeekKey(weekKey: string): { y: number; m: number; d: number } | null {
  const [y, m, d] = weekKey.split("-").map((n) => Number(n));
  if (!y || !m || !d || m < 1 || m > 12) return null;
  return { y, m, d };
}

// "Friday, August 28, 2026" — masthead label in the digest viewer/email.
export function formatWeekKeyLong(weekKey: string): string {
  const parsed = parseWeekKey(weekKey);
  if (!parsed) return weekKey;
  return `Friday, ${MONTHS_LONG[parsed.m - 1]} ${parsed.d}, ${parsed.y}`;
}

// "Friday, Aug 28" — compact label for the digest list column.
export function formatWeekKeyShort(weekKey: string): string {
  const parsed = parseWeekKey(weekKey);
  if (!parsed) return weekKey;
  return `Friday, ${MONTHS_SHORT[parsed.m - 1]} ${parsed.d}`;
}
