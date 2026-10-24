import { copy } from '@/lib/copy';
import { addDays, at, dateParts, daysInMonth, weekdayOf } from '@/lib/dates';
import type { RepeatKind, RepeatPattern, Rule } from '@/lib/types';

// За два месяца срабатывает любой шаблон: самый редкий, monthly, — не реже раза в 31 день
const MAX_LOOKAHEAD_DAYS = 62;

export function occursOn(p: RepeatPattern, date: string): boolean {
  switch (p.kind) {
    case 'daily':
      return true;
    case 'weekdays': {
      const weekday = weekdayOf(date);
      return weekday >= 1 && weekday <= 5;
    }
    case 'weekly':
      return weekdayOf(date) === p.weekday;
    case 'monthly': {
      // Если в месяце нет 31-го (30-го, 29-го) — повтор в последний день месяца
      const { year, month, day } = dateParts(date);
      return day === Math.min(p.monthDay, daysInMonth(year, month));
    }
  }
}

export function ruleOccursOn(rule: Rule, date: string): boolean {
  return rule.active && date >= rule.startDate && occursOn(rule, date);
}

export function nextOccurrence(p: RepeatPattern, from: string, inclusive = true): string {
  for (let i = inclusive ? 0 : 1; i <= MAX_LOOKAHEAD_DAYS; i++) {
    const date = addDays(from, i);
    if (occursOn(p, date)) return date;
  }
  throw new Error(`Повтор ${JSON.stringify(p)} не срабатывает в ближайшие ${MAX_LOOKAHEAD_DAYS} дней`);
}

/** Ближайший день повтора начиная с from (включительно), но не раньше начала правила. */
export function nextRuleDate(rule: Rule, from: string): string {
  return nextOccurrence(rule, rule.startDate > from ? rule.startDate : from);
}

/** Шаблон для пункта меню ↻ при выбранном дне: weekly берёт день недели, monthly — число. */
export function patternFor(kind: RepeatKind, date: string): RepeatPattern {
  switch (kind) {
    case 'daily':
      return { kind };
    case 'weekdays':
      return { kind };
    case 'weekly':
      return { kind, weekday: weekdayOf(date) };
    case 'monthly':
      return { kind, monthDay: dateParts(date).day };
  }
}

export function repeatLabel(p: RepeatPattern): string {
  switch (p.kind) {
    case 'daily':
      return copy.repeat.daily;
    case 'weekdays':
      return copy.repeat.weekdays;
    case 'weekly':
      return at(copy.repeat.weekly, p.weekday);
    case 'monthly':
      return copy.repeat.monthly(p.monthDay);
  }
}
