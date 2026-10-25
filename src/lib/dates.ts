import { copy } from '@/lib/copy';

// Даты — строки 'YYYY-MM-DD'. Арифметика идёт через UTC, поэтому часовой пояс
// и переход на летнее время на неё не влияют. Локальное время трогает только today().

const DAY_MS = 24 * 60 * 60 * 1000;

// Из-за noUncheckedIndexedAccess list[i] имеет тип T | undefined — здесь выход за границы
// считается ошибкой программы, а не «нет значения».
export function at<T>(list: readonly T[], i: number): T {
  if (!Number.isInteger(i) || i < 0 || i >= list.length) {
    throw new RangeError(`Индекс ${i} вне массива длины ${list.length}`);
  }
  return list[i] as T;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// Не toISOString(): он отдаёт дату по UTC, и с 00:00 до 03:00 по Москве это был бы вчерашний день.
export function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Текущее время для createdAt/updatedAt/doneAt — через одну функцию, как today(). */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Локальное время 'HH:MM': для «через час» и «в 9», когда 9 уже прошло. */
export function nowTime(): string {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** '09:00' → '9:00'. Храним с нулём — строки так сравниваются по порядку. */
export function formatTime(time: string): string {
  return time.startsWith('0') ? time.slice(1) : time;
}

export function dateParts(date: string): { year: number; month: number; day: number } {
  return {
    year: Number(date.slice(0, 4)),
    month: Number(date.slice(5, 7)),
    day: Number(date.slice(8, 10)),
  };
}

function toUtc(date: string): number {
  const { year, month, day } = dateParts(date);
  return Date.UTC(year, month - 1, day);
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: string, n: number): string {
  return fromUtc(toUtc(date) + n * DAY_MS);
}

/** Если в месяце нет такого числа — последний день: 31 января + 1 месяц = 28 февраля. */
export function addMonths(date: string, n: number): string {
  const { year, month, day } = dateParts(date);
  const index = year * 12 + (month - 1) + n;
  const y = Math.floor(index / 12);
  const m = (index % 12) + 1;
  return `${y}-${pad(m)}-${pad(Math.min(day, daysInMonth(y, m)))}`;
}

/** Понедельник следующей недели (неделя с понедельника). */
export function nextWeekStart(date: string): string {
  return addDays(date, 7 - ((weekdayOf(date) + 6) % 7));
}

/** Сколько дней от `from` до `to`; отрицательное, если `to` раньше. */
export function diffDays(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

/** Неделя с понедельника: номера дней в порядке календаря и ряда дней в меню ↻. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

/** 0–6, 0 = воскресенье. */
export function weekdayOf(date: string): number {
  return new Date(toUtc(date)).getUTCDay();
}

/** month — 1–12. */
export function daysInMonth(year: number, month: number): number {
  // Нулевой день следующего месяца — последний день этого
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** null, если такой даты нет (31.11, 29.02 в невисокосный год). */
export function makeDate(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(day) || day < 1 || day > daysInMonth(year, month)) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** «27 августа» */
export function formatDayMonth(month: number, day: number): string {
  return `${day} ${at(copy.dates.monthGenitive, month - 1)}`;
}

function dayMonth(date: string): string {
  const { month, day } = dateParts(date);
  return formatDayMonth(month, day);
}

/** «Суббота, 17 октября» */
export function formatHeaderDate(date: string): string {
  return `${capitalize(at(copy.dates.weekdayFull, weekdayOf(date)))}, ${dayMonth(date)}`;
}

/** «сегодня, сб, 17 октября» / «завтра, вс, 18 октября» / «вт, 20 октября» */
export function formatDayLong(date: string, today: string): string {
  const base = `${at(copy.dates.weekdayShort, weekdayOf(date))}, ${dayMonth(date)}`;
  const diff = diffDays(today, date);
  if (diff === 0) return `${copy.dates.today}, ${base}`;
  if (diff === 1) return `${copy.dates.tomorrow}, ${base}`;
  return base;
}

/** «сегодня» / «завтра» / «вт, 20 октября» */
export function formatDayBrief(date: string, today: string): string {
  const diff = diffDays(today, date);
  if (diff === 0) return copy.dates.today;
  if (diff === 1) return copy.dates.tomorrow;
  return formatDayLong(date, today);
}

/** «Пн 19» */
export function formatDayChip(date: string): string {
  return `${capitalize(at(copy.dates.weekdayShort, weekdayOf(date)))} ${dateParts(date).day}`;
}

/** «27 окт» */
export function formatDayShort(date: string): string {
  const { month, day } = dateParts(date);
  return `${day} ${at(copy.dates.monthShort, month - 1)}`;
}

/** «Октябрь 2026» */
export function formatMonthTitle(date: string): string {
  const { year, month } = dateParts(date);
  return `${at(copy.dates.monthName, month - 1)} ${year}`;
}

/** Сколько месяцев от месяца `from` до месяца `to`; дни не учитываются. */
export function monthShift(from: string, to: string): number {
  const a = dateParts(from);
  const b = dateParts(to);
  return (b.year - a.year) * 12 + (b.month - a.month);
}

/** Первое число месяца через `shift` месяцев от месяца `date`: 'YYYY-MM-01'. */
export function monthStart(date: string, shift: number): string {
  const { year, month } = dateParts(date);
  const index = year * 12 + (month - 1) + shift;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}-01`;
}

/** Дни месяца для сетки календаря с понедельника; null — пустые клетки до 1-го. */
export function monthGrid(first: string): (string | null)[] {
  const { year, month } = dateParts(first);
  const blanks = (weekdayOf(first) + 6) % 7;
  const cells: (string | null)[] = Array.from({ length: blanks }, () => null);
  for (let day = 1; day <= daysInMonth(year, month); day++) {
    cells.push(`${year}-${pad(month)}-${pad(day)}`);
  }
  return cells;
}

/** «Пн» … «Вс» — шапка календаря. */
export function weekdayHeaders(): string[] {
  return WEEK_ORDER.map((i) => capitalize(at(copy.dates.weekdayShort, i)));
}
