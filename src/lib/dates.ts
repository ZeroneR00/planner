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

/** Сколько дней от `from` до `to`; отрицательное, если `to` раньше. */
export function diffDays(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

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

function dayMonth(date: string): string {
  const { month, day } = dateParts(date);
  return `${day} ${at(copy.dates.monthGenitive, month - 1)}`;
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
