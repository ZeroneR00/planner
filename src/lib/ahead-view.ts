import { copy } from '@/lib/copy';
import { addDays, capitalize, formatDayBrief, formatDayLong } from '@/lib/dates';
import { nextRuleDate, repeatLabel } from '@/lib/rules';
import { byOrder, isAhead } from '@/lib/today-view';
import type { PlannerData, Rule, Task } from '@/lib/types';

export type AheadDay = { date: string; label: string; tasks: Task[] }; // label: «Завтра, вс, 25 октября»
export type AheadRule = { rule: Rule; label: string }; // label: «каждый вт · следующий — вт, 27 октября»
export type AheadView = { days: AheadDay[]; rules: AheadRule[] };

/** Что показать на экране «Впереди»: задачи по дням и повторы. Повторы в днях не показываем. */
export function aheadView(data: PlannerData): AheadView {
  const { today } = data;
  const tasks = data.tasks
    .filter((t) => isAhead(t, today))
    .sort((a, b) => (a.date === b.date ? byOrder(a, b) : a.date < b.date ? -1 : 1));

  const days: AheadDay[] = [];
  for (const task of tasks) {
    const last = days.at(-1);
    if (last?.date === task.date) last.tasks.push(task);
    else days.push({ date: task.date, label: capitalize(formatDayLong(task.date, today)), tasks: [task] });
  }

  const tomorrow = addDays(today, 1);
  return {
    days,
    rules: data.rules
      .filter((r) => r.active)
      .map((rule) => ({
        rule,
        label: copy.ahead.next(repeatLabel(rule), formatDayBrief(nextRuleDate(rule, tomorrow), today)),
      })),
  };
}
