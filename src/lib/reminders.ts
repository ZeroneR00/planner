import { addDays } from '@/lib/dates';
import { shownTitle } from '@/lib/photo';
import { ruleOccursOn } from '@/lib/rules';
import { compareStrings, isAhead } from '@/lib/today-view';
import type { PlannerData, Task } from '@/lib/types';

// Напоминания — одноразовые уведомления на конкретные дата и время. Время и дата входят в id,
// поэтому смена времени — это отмена старого и постановка нового.

export type Reminder = { id: string; title: string; date: string; time: string };
/** category — набор кнопок уведомления; у поставленных до кнопок его нет. */
export type ScheduledReminder = { id: string; title: string; category: string | null };

/** Набор кнопок «+15 мин · +1 час · Сделано» — у каждого нашего уведомления. */
export const REMINDER_CATEGORY = 'reminder';

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
    add(`t:${task.id}:${momentKey(task.date, task.time)}`, shownTitle(task), task.date, task.time);
  }

  for (const rule of data.rules) {
    if (!rule.active || rule.time === undefined) continue;
    for (let i = 0; i < REMINDER_HORIZON_DAYS; i++) {
      const date = addDays(now.date, i);
      if (!ruleOccursOn(rule, date)) continue;
      // Экземпляр в этот день есть — сделанный или нет, его покрывают задачи
      if (data.tasks.some((t) => t.ruleId === rule.id && t.date === date)) continue;
      add(`r:${rule.id}:${momentKey(date, rule.time)}`, shownTitle(rule), date, rule.time);
    }
  }

  planned.sort(
    (a, b) => compareStrings(momentKey(a.date, a.time), momentKey(b.date, b.time)) || compareStrings(a.id, b.id),
  );
  return planned.slice(0, MAX_REMINDERS);
}

/**
 * Что отменить и что поставить, чтобы запланированное совпало с planned.
 * Без категории — переставляем: так уже стоящие уведомления без кнопок получат кнопки.
 */
export function diffReminders(
  planned: readonly Reminder[],
  scheduled: readonly ScheduledReminder[],
): { cancel: string[]; schedule: Reminder[] } {
  const wanted = new Map(planned.map((r) => [r.id, r]));
  const kept = new Set<string>();
  const cancel: string[] = [];
  for (const s of scheduled) {
    if (wanted.get(s.id)?.title === s.title && s.category === REMINDER_CATEGORY) kept.add(s.id);
    else cancel.push(s.id);
  }
  return { cancel, schedule: planned.filter((r) => !kept.has(r.id)) };
}

/** Куда вести по тапу на уведомление: экран и id задачи или правила, которое подсветить. */
export type RevealTarget = { screen: 'today' | 'ahead'; id: string };

// Во времени есть «:», поэтому не split(':'): t:<id задачи>:2026-10-18T15:00, r:<id правила>:…
const REMINDER_ID = /^([tr]):([^:]+):(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/;

/** Разобранный id напоминания: задача (t) или правило (r), день и время. */
export type ReminderRef = { kind: 't' | 'r'; id: string; date: string; time: string };

/** null — id не наш. */
export function parseReminderId(reminderId: string): ReminderRef | null {
  const [, kind, id, date, time] = REMINDER_ID.exec(reminderId) ?? [];
  if (kind === undefined || id === undefined || date === undefined || time === undefined) return null;
  return { kind: kind === 't' ? 't' : 'r', id, date, time };
}

/** Задача, про которую уведомление: сама задача или экземпляр повтора в этот день. */
export function reminderTask(ref: ReminderRef, tasks: readonly Task[]): Task | undefined {
  return ref.kind === 't'
    ? tasks.find((t) => t.id === ref.id)
    : tasks.find((t) => t.ruleId === ref.id && t.date === ref.date);
}

/** Уведомление всё ещё про несделанную задачу с этими днём и временем. */
export function isCurrent(task: Task | undefined, ref: ReminderRef): task is Task {
  return task !== undefined && !task.done && task.date === ref.date && task.time === ref.time;
}

/** Какие из показанных в шторке уже не про дело. Чужие id не трогаем. */
export function staleShown(
  shownIds: readonly string[],
  data: Pick<PlannerData, 'tasks' | 'rules'>,
): string[] {
  return shownIds.filter((shownId) => {
    const ref = parseReminderId(shownId);
    if (ref === null) return false;
    const task = reminderTask(ref, data.tasks);
    if (task !== undefined) return !isCurrent(task, ref);
    if (ref.kind === 't') return true; // задачу удалили
    // Экземпляра повтора нет — уведомление живо, пока правило напоминает в это время
    return !data.rules.some((r) => r.id === ref.id && r.active && r.time === ref.time);
  });
}

function taskTarget(task: Task, today: string): RevealTarget | null {
  if (task.date === today || (task.date === null && !task.done)) return { screen: 'today', id: task.id };
  if (isAhead(task, today)) return { screen: 'ahead', id: task.id };
  return null; // прошлый день или сделанная будущая — на экранах её нет
}

/** null — по уведомлению больше нечего показать: приложение просто открывается. */
export function reminderTarget(
  reminderId: string,
  data: Pick<PlannerData, 'tasks' | 'rules' | 'today'>,
): RevealTarget | null {
  const ref = parseReminderId(reminderId);
  if (ref === null) return null;
  const task = reminderTask(ref, data.tasks);
  if (task !== undefined) return taskTarget(task, data.today);
  // Экземпляра повтора ещё нет — показываем само правило в «Повторяется»
  if (ref.kind === 'r' && data.rules.some((r) => r.id === ref.id && r.active)) {
    return { screen: 'ahead', id: ref.id };
  }
  return null;
}
