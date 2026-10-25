import { copy } from '@/lib/copy';
import { WEEK_ORDER, addDays, at, dateParts, daysInMonth, formatDayMonth, weekdayOf } from '@/lib/dates';
import type { RepeatKind, RepeatPattern, Rule } from '@/lib/types';

// За год срабатывает любой шаблон: самый редкий, yearly, — раз в 365–366 дней
const MAX_LOOKAHEAD_DAYS = 366;

export function occursOn(p: RepeatPattern, date: string): boolean {
  switch (p.kind) {
    case 'daily':
      return true;
    case 'weekdays': {
      const weekday = weekdayOf(date);
      return weekday >= 1 && weekday <= 5;
    }
    case 'weekly':
      return p.weekdays.includes(weekdayOf(date));
    case 'monthly': {
      // Если в месяце нет 31-го (30-го, 29-го) — повтор в последний день месяца
      const { year, month, day } = dateParts(date);
      return day === Math.min(p.monthDay, daysInMonth(year, month));
    }
    case 'yearly': {
      // 29 февраля в невисокосный год — 28-го, как у monthly
      const { year, month, day } = dateParts(date);
      return month === p.month && day === Math.min(p.monthDay, daysInMonth(year, month));
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

/** Шаблон для пункта меню ↻ при выбранном дне: weekly берёт день недели, monthly — число, yearly — число и месяц. */
export function patternFor(kind: RepeatKind, date: string): RepeatPattern {
  switch (kind) {
    case 'daily':
      return { kind };
    case 'weekdays':
      return { kind };
    case 'weekly':
      return { kind, weekdays: [weekdayOf(date)] };
    case 'monthly':
      return { kind, monthDay: dateParts(date).day };
    case 'yearly': {
      const { month, day } = dateParts(date);
      return { kind, month, monthDay: day };
    }
  }
}

export function repeatLabel(p: RepeatPattern): string {
  switch (p.kind) {
    case 'daily':
      return copy.repeat.daily;
    case 'weekdays':
      return copy.repeat.weekdays;
    case 'weekly': {
      // Неделя с понедельника: «по сб и вс», а не «по вс и сб»
      const names = WEEK_ORDER.filter((d) => p.weekdays.includes(d)).map((d) =>
        at(copy.dates.weekdayShort, d),
      );
      const last = names.pop();
      if (last === undefined) throw new Error('Еженедельный повтор без дней');
      if (names.length === 0) return at(copy.repeat.weekly, at(p.weekdays, 0));
      return copy.repeat.weeklyMany(names.join(', '), last);
    }
    case 'monthly':
      return copy.repeat.monthly(p.monthDay);
    case 'yearly':
      return copy.repeat.yearly(formatDayMonth(p.month, p.monthDay));
  }
}

export function samePattern(a: RepeatPattern | null, b: RepeatPattern | null): boolean {
  if (a === null || b === null) return a === b;
  switch (a.kind) {
    case 'daily':
    case 'weekdays':
      return a.kind === b.kind;
    case 'weekly':
      return (
        b.kind === 'weekly' &&
        a.weekdays.length === b.weekdays.length &&
        a.weekdays.every((d, i) => d === b.weekdays[i])
      );
    case 'monthly':
      return b.kind === 'monthly' && a.monthDay === b.monthDay;
    case 'yearly':
      return b.kind === 'yearly' && a.month === b.month && a.monthDay === b.monthDay;
  }
}
