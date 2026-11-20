import { addDays, shiftMoment } from '@/lib/dates';
import { shownTitle } from '@/lib/photo';
import { hourlySlots, ruleOccursOn } from '@/lib/rules';
import { compareStrings, isAhead } from '@/lib/today-view';
import type { PlannerData, Rule, Task } from '@/lib/types';

// Напоминания — одноразовые уведомления на конкретные дата и время. Время и дата входят в id,
// поэтому смена времени — это отмена старого и постановка нового.
// Каждое напоминание «донимает»: повторяется каждые NAG_MINUTES, пока не нажмут «Сделано» или не отложат.
// Повтор — отдельное уведомление с суффиксом :n<k>; в разобранном id время — основное, не повтора.

/** category — набор кнопок уведомления. */
export type Reminder = { id: string; title: string; date: string; time: string; category: string };
/** У поставленных до кнопок категории нет. */
export type ScheduledReminder = { id: string; title: string; category: string | null };

/** Набор кнопок «+15 мин · +1 час · Сделано» — у задач и повторов по дням. */
export const REMINDER_CATEGORY = 'reminder';
/** У «каждые N часов» одна кнопка «Сделано»: отложить нечего, следующий раз и так скоро. */
export const HOURLY_CATEGORY = 'hourly';

/** Повторы по дням планируем на 14 дней вперёд, начиная с сегодня; дальше дотянет следующее открытие. */
export const REMINDER_HORIZON_DAYS = 14;
/** Донимает каждые 10 минут; задача — до часа (6 раз), потом молчит. */
export const NAG_MINUTES = 10;
export const NAG_COUNT = 6;
/** «Каждые N часов» — на 3 дня; повторы только у 3 ближайших разов: будильников у приложения не бесконечно. */
export const HOURLY_HORIZON_DAYS = 3;
export const HOURLY_NAG_SLOTS = 3;
/** Чаще раза в полчаса не донимает: следующий раз и так скоро. */
export const HOURLY_NAG_MIN_STEP = 30;
/** На одно правило — не больше 100 вместе с повторами: иначе «каждые 15 минут» вытеснит остальные задачи. */
export const HOURLY_MAX_PER_RULE = 100;
/** Ближайшие; Android держит до 500 будильников на приложение. */
export const MAX_REMINDERS = 200;

function momentKey(date: string, time: string): string {
  return `${date}T${time}`;
}

function nagId(id: string, k: number): string {
  return `${id}:n${k}`;
}

type Moment = { date: string; time: string };

/** Повторы основного: каждые NAG_MINUTES, пока момент раньше until (если задан), не больше NAG_COUNT. */
function nagMoments(date: string, time: string, until: string | null): Moment[] {
  const moments: Moment[] = [];
  for (let k = 1; k <= NAG_COUNT; k++) {
    const moment = shiftMoment(date, time, k * NAG_MINUTES);
    if (until !== null && momentKey(moment.date, moment.time) >= until) break;
    moments.push(moment);
  }
  return moments;
}

type HourlyRule = Extract<Rule, { kind: 'hourly' }>;

/** Следующий раз после date + time: позже в тот же день или первый раз следующего дня. */
function nextSlot(rule: HourlyRule, date: string, time: string): string {
  const slots = hourlySlots(rule);
  const later = slots.find((slot) => slot > time);
  if (later !== undefined) return momentKey(date, later);
  return momentKey(addDays(date, 1), slots[0] ?? time);
}

/** Что должно стоять в уведомлениях сейчас: ближайшие первыми, не больше MAX_REMINDERS. */
export function planReminders(data: Pick<PlannerData, 'tasks' | 'rules'>, now: Moment): Reminder[] {
  const from = momentKey(now.date, now.time);
  const planned: Reminder[] = [];
  // Каждое — отдельно: повторы уже прошедшего основного остаются
  const add = (id: string, title: string, moment: Moment, category: string) => {
    if (momentKey(moment.date, moment.time) > from) planned.push({ id, title, ...moment, category });
  };
  const nagged = (id: string, title: string, date: string, time: string) => {
    add(id, title, { date, time }, REMINDER_CATEGORY);
    nagMoments(date, time, null).forEach((m, i) => add(nagId(id, i + 1), title, m, REMINDER_CATEGORY));
  };

  for (const task of data.tasks) {
    if (task.done || task.date === null || task.time === undefined) continue;
    nagged(`t:${task.id}:${momentKey(task.date, task.time)}`, shownTitle(task), task.date, task.time);
  }

  for (const rule of data.rules) {
    if (!rule.active) continue;
    if (rule.kind === 'hourly') {
      planHourly(rule, now, add);
      continue;
    }
    if (rule.time === undefined) continue;
    for (let i = 0; i < REMINDER_HORIZON_DAYS; i++) {
      const date = addDays(now.date, i);
      if (!ruleOccursOn(rule, date)) continue;
      // Экземпляр в этот день есть — сделанный или нет, его покрывают задачи
      if (data.tasks.some((t) => t.ruleId === rule.id && t.date === date)) continue;
      nagged(`r:${rule.id}:${momentKey(date, rule.time)}`, shownTitle(rule), date, rule.time);
    }
  }

  planned.sort(
    (a, b) => compareStrings(momentKey(a.date, a.time), momentKey(b.date, b.time)) || compareStrings(a.id, b.id),
  );
  return planned.slice(0, MAX_REMINDERS);
}

function planHourly(
  rule: HourlyRule,
  now: Moment,
  add: (id: string, title: string, moment: Moment, category: string) => void,
): void {
  const from = momentKey(now.date, now.time);
  const title = shownTitle(rule);
  let naggedSlots = 0;
  let count = 0;
  // Считаем только будущие: прошедшие add и так не ставит
  const addCounted = (id: string, moment: Moment) => {
    if (count >= HOURLY_MAX_PER_RULE || momentKey(moment.date, moment.time) <= from) return;
    count++;
    add(id, title, moment, HOURLY_CATEGORY);
  };
  for (let i = 0; i < HOURLY_HORIZON_DAYS; i++) {
    const date = addDays(now.date, i);
    if (date < rule.startDate) continue;
    for (const slot of hourlySlots(rule)) {
      const key = momentKey(date, slot);
      // На этот раз уже нажали «Сделано»
      if (rule.doneSlot !== undefined && key <= rule.doneSlot) continue;
      const id = `h:${rule.id}:${key}`;
      addCounted(id, { date, time: slot });
      if (rule.minutes < HOURLY_NAG_MIN_STEP) continue;
      // Донимает до следующего раза; у последнего за день — как задача, не больше NAG_COUNT
      const next = nextSlot(rule, date, slot);
      const until = next.slice(0, 10) === date ? next : null;
      const nags = nagMoments(date, slot, until);
      const last = nags.at(-1);
      if (last === undefined || momentKey(last.date, last.time) <= from) continue;
      if (naggedSlots >= HOURLY_NAG_SLOTS) continue;
      naggedSlots++;
      nags.forEach((m, k) => addCounted(nagId(id, k + 1), m));
    }
  }
}

/**
 * Что отменить и что поставить, чтобы запланированное совпало с planned.
 * Другая категория или её нет — переставляем: так уведомления получат нужные кнопки.
 */
export function diffReminders(
  planned: readonly Reminder[],
  scheduled: readonly ScheduledReminder[],
): { cancel: string[]; schedule: Reminder[] } {
  const wanted = new Map(planned.map((r) => [r.id, r]));
  const kept = new Set<string>();
  const cancel: string[] = [];
  for (const s of scheduled) {
    const w = wanted.get(s.id);
    if (w !== undefined && w.title === s.title && s.category === w.category) kept.add(s.id);
    else cancel.push(s.id);
  }
  return { cancel, schedule: planned.filter((r) => !kept.has(r.id)) };
}

/** Куда вести по тапу на уведомление: экран и id задачи или правила, которое подсветить. */
export type RevealTarget = { screen: 'today' | 'ahead'; id: string };

// Во времени есть «:», поэтому не split(':'): t:<id задачи>:2026-10-18T15:00, r:<id правила>:…,
// h:<id правила «каждые N часов»>:…; у повтора в конце :n<k>
const REMINDER_ID = /^([trh]):([^:]+):(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::n\d+)?$/;

/** Разобранный id напоминания: задача (t), правило (r) или «каждые N часов» (h), день и основное время. */
export type ReminderRef = { kind: 't' | 'r' | 'h'; id: string; date: string; time: string };

function refKind(kind: string): ReminderRef['kind'] {
  return kind === 't' ? 't' : kind === 'h' ? 'h' : 'r';
}

/** null — id не наш. */
export function parseReminderId(reminderId: string): ReminderRef | null {
  const [, kind, id, date, time] = REMINDER_ID.exec(reminderId) ?? [];
  if (kind === undefined || id === undefined || date === undefined || time === undefined) return null;
  return { kind: refKind(kind), id, date, time };
}

/** Задача, про которую уведомление: сама задача или экземпляр повтора в этот день. У h задач нет. */
export function reminderTask(ref: ReminderRef, tasks: readonly Task[]): Task | undefined {
  if (ref.kind === 'h') return undefined;
  return ref.kind === 't'
    ? tasks.find((t) => t.id === ref.id)
    : tasks.find((t) => t.ruleId === ref.id && t.date === ref.date);
}

/** Уведомление всё ещё про несделанную задачу с этими днём и временем. */
export function isCurrent(task: Task | undefined, ref: ReminderRef): task is Task {
  return task !== undefined && !task.done && task.date === ref.date && task.time === ref.time;
}

/** «Каждые N часов»: уведомление устарело, если раз отметили, правило поменяли или уже начался следующий раз. */
function hourlyStale(ref: ReminderRef, rules: readonly Rule[], now: string): boolean {
  const rule = rules.find((r) => r.id === ref.id);
  if (rule?.kind !== 'hourly' || !rule.active) return true;
  const key = momentKey(ref.date, ref.time);
  if (rule.doneSlot !== undefined && key <= rule.doneSlot) return true;
  if (!hourlySlots(rule).includes(ref.time)) return true;
  return nextSlot(rule, ref.date, ref.time) <= now;
}

/** Какие из показанных в шторке уже не про дело. Чужие id не трогаем. */
export function staleShown(
  shownIds: readonly string[],
  data: Pick<PlannerData, 'tasks' | 'rules'>,
  now: Moment,
): string[] {
  return shownIds.filter((shownId) => {
    const ref = parseReminderId(shownId);
    if (ref === null) return false;
    if (ref.kind === 'h') return hourlyStale(ref, data.rules, momentKey(now.date, now.time));
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
  // Экземпляра повтора ещё нет (а у «каждые N часов» их не бывает) — показываем правило в «Повторяется»
  if (ref.kind !== 't' && data.rules.some((r) => r.id === ref.id && r.active)) {
    return { screen: 'ahead', id: ref.id };
  }
  return null;
}
