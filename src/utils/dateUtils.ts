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

export function isYesterday(dateStr: string): boolean {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const formattedYesterday = formatDateString(yesterday);
  return dateStr === formattedYesterday;
}
