export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const date = new Date(year, month - 1, 1);
  const days: Date[] = [];
  while (date.getMonth() === month - 1) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDayNameOfWeek(dateStr: string): string {
  const date = new Date(dateStr);
  const dayIndex = date.getDay();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dayIndex];
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function msUntilLocalMidnight(now: Date = new Date()): number {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, midnight.getTime() - now.getTime());
}

export function countDatesWithinLastDays(
  dates: string[],
  days: number,
  now: Date = new Date(),
): number {
  const accepted = new Set<string>();
  for (let offset = 0; offset < days; offset++) {
    const day = new Date(now);
    day.setHours(12, 0, 0, 0);
    day.setDate(day.getDate() - offset);
    accepted.add(formatDateString(day));
    accepted.add(day.toISOString().split('T')[0]);
  }
  const kept = new Set<string>();
  for (const date of dates) {
    if (accepted.has(date)) kept.add(date);
  }
  return kept.size;
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function isYesterday(dateStr: string): boolean {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const formattedYesterday = formatDateString(yesterday);
  return dateStr === formattedYesterday;
}
