import { copy } from '@/lib/copy';
import {
  addDays,
  at,
  capitalize,
  dateParts,
  diffDays,
  formatDayChip,
  formatDayLong,
  formatDayShort,
  weekdayOf,
} from '@/lib/dates';
import { parseWhen } from '@/lib/parse-when';
import { patternFor, repeatLabel } from '@/lib/rules';
import type { RepeatKind, RepeatPattern } from '@/lib/types';

// Поле записи: что написано, что выбрано вручную и как приложение это поняло.
// Побеждает последнее действие: чип или пункт ↻ главнее текста, пока текст не дал новую дату или новый повтор.

export type Choice<T> = { manual: false } | { manual: true; value: T }; // manual: false — решает текст
export type Draft = { text: string; date: Choice<string | null>; repeat: Choice<RepeatKind | null> };

export const emptyDraft: Draft = { text: '', date: { manual: false }, repeat: { manual: false } };

export type When = { title: string; date: string | null; repeat: RepeatPattern | null; fromText: boolean };

export type HintPart = { text: string; icon?: 'arrowRight' | 'repeat' }; // имена — как в IconName
export type Hint = { accent: boolean; parts: HintPart[] }; // части выводятся через « · »

export type WhenChip = { key: string; label: string; date: string | null };
export type RepeatOption = { kind: RepeatKind | null; label: string };

/** Сколько дней после сегодня показывает бегунок; дальше — через календарь. */
export const NEAR_DAYS = 6;

export function hasText(draft: Draft): boolean {
  return draft.text.trim() !== '';
}

export function editText(draft: Draft, text: string, today: string): Draft {
  // Стёр всё — следующая мысль начинается с чистого листа, а не молча уходит на прошлый чип
  if (text.trim() === '') return { ...emptyDraft, text };
  const prev = parseWhen(draft.text, today);
  const next = parseWhen(text, today);
  if (next.hit && (next.date !== prev.date || next.repeat?.kind !== prev.repeat?.kind)) {
    return { ...emptyDraft, text };
  }
  return { ...draft, text };
}

export function pickDate(draft: Draft, date: string | null): Draft {
  return { ...draft, date: { manual: true, value: date } };
}

export function pickRepeat(draft: Draft, kind: RepeatKind | null): Draft {
  return { ...draft, repeat: { manual: true, value: kind } };
}

export function resolveWhen(draft: Draft, today: string): When {
  const parsed = parseWhen(draft.text, today);
  const title = parsed.title.replace(/\s+/g, ' ').trim();
  const date = draft.date.manual ? draft.date.value : parsed.date;
  if (date === null) return { title, date: null, repeat: null, fromText: false };
  const kind = draft.repeat.manual ? draft.repeat.value : (parsed.repeat?.kind ?? null);
  // Повтор из текста берём как есть: «каждое 31-е» с ближайшей датой 30 ноября остаётся 31-м
  const repeat =
    kind === null
      ? null
      : parsed.repeat !== null && parsed.repeat.kind === kind && parsed.date === date
        ? parsed.repeat
        : patternFor(kind, date);
  return { title, date, repeat, fromText: parsed.hit && !draft.date.manual };
}

/** Строка над полем, пока печатаешь. */
export function whenHint(when: When, today: string): Hint {
  if (when.date === null) return { accent: false, parts: [{ text: copy.composer.toPocket }] };
  const parts: HintPart[] = [{ text: formatDayLong(when.date, today), icon: 'arrowRight' }];
  if (when.repeat !== null) parts.push({ text: repeatLabel(when.repeat), icon: 'repeat' });
  if (when.fromText) parts.push({ text: copy.composer.fromText });
  return { accent: true, parts };
}

/** Строка над полем после добавления — до следующей буквы. */
export function addedHint(when: When, today: string): Hint {
  if (when.date === null) return { accent: false, parts: [{ text: copy.composer.addedToPocket }] };
  if (when.repeat !== null) {
    const from = when.date === today ? copy.dates.today : formatDayShort(when.date);
    const label = copy.composer.addedRepeat(capitalize(repeatLabel(when.repeat)), from);
    return { accent: false, parts: [{ text: label, icon: 'repeat' }] };
  }
  if (when.date === today) return { accent: false, parts: [{ text: copy.composer.addedToday }] };
  return { accent: false, parts: [{ text: copy.composer.scheduled(formatDayLong(when.date, today)) }] };
}

/** Чипы бегунка без «Дата»: «В карман», «Сегодня», «Завтра» и ещё NEAR_DAYS − 1 дней. */
export function whenChips(today: string): WhenChip[] {
  const chips: WhenChip[] = [
    { key: 'pocket', label: copy.composer.chipPocket, date: null },
    { key: today, label: copy.composer.chipToday, date: today },
  ];
  const tomorrow = addDays(today, 1);
  chips.push({ key: tomorrow, label: copy.composer.chipTomorrow, date: tomorrow });
  for (let i = 2; i <= NEAR_DAYS; i++) {
    const date = addDays(today, i);
    chips.push({ key: date, label: formatDayChip(date), date });
  }
  return chips;
}

function isFar(date: string, today: string): boolean {
  return diffDays(today, date) > NEAR_DAYS;
}

/** Какой чип выбран: 'pocket', дата ближнего дня или 'calendar' для дальней даты. */
export function chipKey(date: string | null, today: string): string {
  if (date === null) return 'pocket';
  return isFar(date, today) ? 'calendar' : date;
}

export function calendarChipLabel(date: string | null, today: string): string {
  return date !== null && isFar(date, today) ? formatDayShort(date) : copy.composer.calendar;
}

/** Пункты меню ↻; день недели и число берутся от выбранного дня. */
export function repeatOptions(date: string): RepeatOption[] {
  return [
    { kind: null, label: copy.composer.repeatOnce },
    { kind: 'daily', label: copy.composer.repeatDaily },
    { kind: 'weekdays', label: copy.composer.repeatWeekdays },
    { kind: 'weekly', label: copy.composer.repeatWeekly(at(copy.repeat.weeklyPlural, weekdayOf(date))) },
    { kind: 'monthly', label: copy.composer.repeatMonthly(dateParts(date).day) },
  ];
}
