import { copy } from '@/lib/copy';
import {
  addDays,
  at,
  capitalize,
  diffDays,
  formatDayChip,
  formatDayLong,
  formatDayMonth,
  formatDayShort,
} from '@/lib/dates';
import { parseWhen } from '@/lib/parse-when';
import { nextOccurrence, occursOn, patternFor, repeatLabel, samePattern } from '@/lib/rules';
import type { RepeatKind, RepeatPattern } from '@/lib/types';

// Поле записи: что написано, что выбрано вручную и как приложение это поняло.
// Побеждает последнее действие: чип или пункт ↻ главнее текста, пока текст не дал новую дату или новый повтор.

export type Choice<T> = { manual: false } | { manual: true; value: T }; // manual: false — решает текст
export type Draft = { text: string; date: Choice<string | null>; repeat: Choice<RepeatPattern | null> };

export const emptyDraft: Draft = { text: '', date: { manual: false }, repeat: { manual: false } };

export type When = { title: string; date: string | null; repeat: RepeatPattern | null; fromText: boolean };

export type HintPart = { text: string; icon?: 'arrowRight' | 'repeat' }; // имена — как в IconName
export type Hint = { accent: boolean; parts: HintPart[] }; // части выводятся через « · »

export type WhenChip = { key: string; label: string; date: string | null };
export type RepeatOption = { key: string; pattern: RepeatPattern | null; label: string };

/** Сколько дней после сегодня показывает бегунок; дальше — через календарь. */
export const NEAR_DAYS = 6;

export function hasText(draft: Draft): boolean {
  return draft.text.trim() !== '';
}

export function editText(draft: Draft, text: string, today: string, editing = false): Draft {
  // Стёр всё — следующая мысль начинается с чистого листа, а не молча уходит на прошлый чип.
  // В правке выбор остаётся: стёр, чтобы написать название заново, а день и повтор — те же
  if (text.trim() === '') return editing ? { ...draft, text } : { ...emptyDraft, text };
  const prev = parseWhen(draft.text, today);
  const next = parseWhen(text, today);
  if (next.hit && (next.date !== prev.date || !samePattern(next.repeat, prev.repeat))) {
    return { ...emptyDraft, text };
  }
  return { ...draft, text };
}

export function pickDate(draft: Draft, date: string | null): Draft {
  const repeat = draft.repeat;
  // Ручной повтор, который в этот день не срабатывает, берёт день от чипа: «по ср и чт» + «Пт» — «каждую пт»
  if (repeat.manual && repeat.value !== null && date !== null && !occursOn(repeat.value, date)) {
    return {
      ...draft,
      date: { manual: true, value: date },
      repeat: { manual: true, value: patternFor(repeat.value.kind, date) },
    };
  }
  return { ...draft, date: { manual: true, value: date } };
}

export function pickRepeat(draft: Draft, repeat: RepeatPattern | null): Draft {
  return { ...draft, repeat: { manual: true, value: repeat } };
}

/** Тап по дню в ряду ↻: день включается или выключается; выключили последний — «Один раз». */
export function toggleWeekday(draft: Draft, today: string, weekday: number): Draft {
  const current = resolveWhen(draft, today).repeat;
  const days = current?.kind === 'weekly' ? current.weekdays : [];
  const next = days.includes(weekday)
    ? days.filter((d) => d !== weekday)
    : [...days, weekday].sort((a, b) => a - b);
  return pickRepeat(draft, next.length === 0 ? null : { kind: 'weekly', weekdays: next });
}

export function resolveWhen(draft: Draft, today: string): When {
  const parsed = parseWhen(draft.text, today);
  const title = parsed.title.replace(/\s+/g, ' ').trim();
  const picked = draft.date.manual ? draft.date.value : parsed.date;
  if (picked === null) return { title, date: null, repeat: null, fromText: false };
  const fromText = parsed.hit && !draft.date.manual;
  if (draft.repeat.manual) {
    const repeat = draft.repeat.value;
    // Дни отметили в ряду ↻, а выбранный день не из них — повтор начинается с ближайшего отмеченного.
    // Считаем от выбранного дня, а не от прошлого сдвига, поэтому начало не «уползает»
    const date = repeat === null || occursOn(repeat, picked) ? picked : nextOccurrence(repeat, picked);
    return { title, date, repeat, fromText };
  }
  // Повтор из текста берём как есть, если он срабатывает в этот день: «каждое 31-е» 30 ноября остаётся 31-м
  const repeat =
    parsed.repeat === null
      ? null
      : occursOn(parsed.repeat, picked)
        ? parsed.repeat
        : patternFor(parsed.repeat.kind, picked);
  return { title, date: picked, repeat, fromText };
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

const OPTION_KINDS: readonly RepeatKind[] = ['daily', 'weekdays', 'weekly', 'monthly', 'yearly'];

function optionLabel(p: RepeatPattern | null): string {
  if (p === null) return copy.composer.repeatOnce;
  switch (p.kind) {
    case 'daily':
      return copy.composer.repeatDaily;
    case 'weekdays':
      return copy.composer.repeatWeekdays;
    case 'weekly':
      return copy.composer.repeatWeekly(
        p.weekdays.length === 1 ? at(copy.repeat.weeklyPlural, at(p.weekdays, 0)) : repeatLabel(p),
      );
    case 'monthly':
      return copy.composer.repeatMonthly(p.monthDay);
    case 'yearly':
      return copy.composer.repeatYearly(formatDayMonth(p.month, p.monthDay));
  }
}

/**
 * Пункты меню ↻. Повтор того же вида, что выбран сейчас, остаётся как есть («по ср и чт»),
 * остальные берут день недели, число и месяц от выбранного дня.
 */
export function repeatOptions(date: string, current: RepeatPattern | null): RepeatOption[] {
  const patterns = OPTION_KINDS.map((kind) =>
    current !== null && current.kind === kind ? current : patternFor(kind, date),
  );
  return [null, ...patterns].map((pattern) => ({
    key: pattern?.kind ?? 'once',
    pattern,
    label: optionLabel(pattern),
  }));
}
