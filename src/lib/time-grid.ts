import { copy } from '@/lib/copy';
import { formatTime } from '@/lib/dates';
import { AFTERNOON, EVENING, MORNING } from '@/lib/parse-when';

// Панель ⏰: что показать и какое время поставит каждый тап. Компонент только рисует.

/** time — какое время поставит тап; a11y — подпись для читалки экрана. */
export type TimeCell = {
  key: string;
  label: string;
  a11y: string;
  time: string;
  selected: boolean;
  disabled: boolean;
};
export type TimeGrid = { presets: TimeCell[]; hours: TimeCell[]; minutes: TimeCell[] };

/** Шаг минут в панели; точнее — словами («в 15:37»). */
export const MINUTE_STEP = 5;

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, i) => i * MINUTE_STEP);

const PRESETS = [
  { key: 'morning', label: copy.composer.morning, time: MORNING },
  { key: 'afternoon', label: copy.composer.afternoon, time: AFTERNOON },
  { key: 'evening', label: copy.composer.evening, time: EVENING },
] as const;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function hhmm(hour: number, minute: number): string {
  return `${pad(hour)}:${pad(minute)}`;
}

/**
 * time — выбранное 'HH:MM' или null; date — выбранный день; now — 'HH:MM'.
 * Сегодня прошедшее неактивно: напоминание на «уже было» не поставить (так же считает reminders.ts).
 */
export function timeGrid(time: string | null, date: string, today: string, now: string): TimeGrid {
  const past = (t: string) => date === today && t <= now;
  const hour = time === null ? null : Number(time.slice(0, 2));
  const minute = time === null ? null : Number(time.slice(3, 5));

  const presets = PRESETS.map((p) => ({
    key: p.key,
    label: `${p.label} ${formatTime(p.time)}`,
    a11y: `${p.label} ${formatTime(p.time)}`,
    time: p.time,
    selected: p.time === time,
    disabled: past(p.time),
  }));

  const hours = HOURS.map((h) => {
    // Минуты остаются от выбранного времени; прошли — ближайшие будущие в этом часе
    const kept = hhmm(h, minute ?? 0);
    const next = past(kept) ? MINUTES.map((m) => hhmm(h, m)).find((t) => !past(t)) : kept;
    return {
      key: `h${h}`,
      label: String(h),
      a11y: copy.composer.hourLabel(h),
      time: next ?? kept,
      selected: h === hour,
      disabled: next === undefined,
    };
  });

  const minutes = MINUTES.map((m) => {
    const t = hhmm(hour ?? 0, m);
    return {
      key: `m${m}`,
      label: `:${pad(m)}`,
      a11y: copy.composer.minuteLabel(m),
      time: t,
      selected: m === minute,
      disabled: hour === null || past(t),
    };
  });

  return { presets, hours, minutes };
}
