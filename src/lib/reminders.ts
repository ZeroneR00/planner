import { addDays } from '@/lib/dates';
import { ruleOccursOn } from '@/lib/rules';
import { compareStrings } from '@/lib/today-view';
import type { PlannerData } from '@/lib/types';

// Напоминания — одноразовые уведомления на конкретные дата и время. Время и дата входят в id,
// поэтому смена времени — это отмена старого и постановка нового.

export type Reminder = { id: string; title: string; date: string; time: string };
export type ScheduledReminder = { id: string; title: string };

/** Повторы планируем на 14 дней вперёд, начиная с сегодня; дальше дотянет следующее открытие. */
export const REMINDER_HORIZON_DAYS = 14;
/** Ближайшие; Android держит до 500 будильников на приложение. */
export const MAX_REMINDERS = 100;

function momentKey(date: string, time: string): string {
  return `${date}T${time}`;
}

/** Что должно стоять в уведомлениях сейчас: ближайшие первыми, не больше MAX_REMINDERS. */
export function planReminders(
  data: Pick<PlannerData, 'tasks' | 'rules'>,
  now: { date: string; time: string },
): Reminder[] {
  const from = momentKey(now.date, now.time);
  const planned: Reminder[] = [];
  const add = (id: string, title: string, date: string, time: string) => {
    if (momentKey(date, time) > from) planned.push({ id, title, date, time });
  };

  for (const task of data.tasks) {
    if (task.done || task.date === null || task.time === undefined) continue;
    add(`t:${task.id}:${momentKey(task.date, task.time)}`, task.title, task.date, task.time);
  }

  for (const rule of data.rules) {
    if (!rule.active || rule.time === undefined) continue;
    for (let i = 0; i < REMINDER_HORIZON_DAYS; i++) {
      const date = addDays(now.date, i);
      if (!ruleOccursOn(rule, date)) continue;
      // Экземпляр в этот день есть — сделанный или нет, его покрывают задачи
      if (data.tasks.some((t) => t.ruleId === rule.id && t.date === date)) continue;
      add(`r:${rule.id}:${momentKey(date, rule.time)}`, rule.title, date, rule.time);
    }
  }

  planned.sort(
    (a, b) => compareStrings(momentKey(a.date, a.time), momentKey(b.date, b.time)) || compareStrings(a.id, b.id),
  );
  return planned.slice(0, MAX_REMINDERS);
}

/** Что отменить и что поставить, чтобы запланированное совпало с planned. */
export function diffReminders(
  planned: readonly Reminder[],
  scheduled: readonly ScheduledReminder[],
): { cancel: string[]; schedule: Reminder[] } {
  const wanted = new Map(planned.map((r) => [r.id, r]));
  const kept = new Set<string>();
  const cancel: string[] = [];
  for (const s of scheduled) {
    if (wanted.get(s.id)?.title === s.title) kept.add(s.id);
    else cancel.push(s.id);
  }
  return { cancel, schedule: planned.filter((r) => !kept.has(r.id)) };
}
