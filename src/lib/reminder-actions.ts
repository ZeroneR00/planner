import type { Changes } from '@/lib/changes';
import { shiftMoment } from '@/lib/dates';
import { isCurrent, parseReminderId, reminderTask } from '@/lib/reminders';
import { placeInDay, toggleDone, withTime } from '@/lib/task-actions';
import { MINUTE_STEP } from '@/lib/time-grid';
import type { PlannerData, Rule, Task } from '@/lib/types';

// Кнопки в уведомлении: «+15 мин», «+1 час», «Сделано». Срабатывают в шторке, приложение не открывают.

export const REMINDER_ACTIONS = ['snooze15', 'snooze60', 'done'] as const;
export type ReminderAction = (typeof REMINDER_ACTIONS)[number];

const SNOOZE_MINUTES: Record<Exclude<ReminderAction, 'done'>, number> = { snooze15: 15, snooze60: 60 };

export function isReminderAction(id: string): id is ReminderAction {
  return (REMINDER_ACTIONS as readonly string[]).includes(id);
}

/** now + minutes с округлением вверх до 5 минут (как сетка ⏰, MINUTE_STEP); за полночь — следующий день. */
export function snoozeMoment(date: string, time: string, minutes: number): { date: string; time: string } {
  const from = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  const rounded = Math.ceil((from + minutes) / MINUTE_STEP) * MINUTE_STEP;
  return shiftMoment(date, time, rounded - from);
}

function snooze(data: PlannerData, task: Task, minutes: number, nowTime: string, nowIso: string): Changes {
  const moment = snoozeMoment(data.today, nowTime, minutes);
  const { order, shifted } = placeInDay(data.tasks, moment.date, moment.time, task.id);
  if (moment.date === task.date) {
    return { putTasks: [withTime({ ...task, order, updatedAt: nowIso }, moment.time), ...shifted] };
  }
  // За полночь — как перенос на другой день в правке: повтор и «вернулась» снимаются
  const { returned, ruleId, ...rest } = task;
  const moved: Task = { ...rest, date: moment.date, order, updatedAt: nowIso };
  return { putTasks: [withTime(moved, moment.time), ...shifted] };
}

/**
 * Кнопка из уведомления. data — уже после смены дня (startDay). nowTime — 'HH:MM', nowIso — для updatedAt.
 * null — уведомление устарело (задачи нет, сделана, время или день уже другие): так же повторное
 * нажатие или двойная доставка (слушатель + фоновая задача) ничего не меняют.
 */
export function reminderActionChanges(
  data: PlannerData,
  reminderId: string,
  action: ReminderAction,
  nowTime: string,
  nowIso: string,
): Changes | null {
  const ref = parseReminderId(reminderId);
  if (ref === null) return null;
  if (ref.kind === 'h') {
    // У «каждые N часов» только «Сделано»: до следующего раза тихо
    const rule = data.rules.find((r) => r.id === ref.id);
    const slot = `${ref.date}T${ref.time}`;
    if (action !== 'done' || rule?.kind !== 'hourly' || !rule.active) return null;
    if (rule.doneSlot !== undefined && slot <= rule.doneSlot) return null;
    const done: Rule = { ...rule, doneSlot: slot };
    return { putRules: [done] };
  }
  const task = reminderTask(ref, data.tasks);
  if (!isCurrent(task, ref)) return null;
  if (action === 'done') return toggleDone(task, nowIso);
  return snooze(data, task, SNOOZE_MINUTES[action], nowTime, nowIso);
}
