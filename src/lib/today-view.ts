import { repeatLabel } from '@/lib/rules';
import type { PlannerData, Task } from '@/lib/types';

/** Задача дня и подпись повтора («каждый день») или null, если она не из правила. */
export type DayItem = { task: Task; repeat: string | null };

export type TodayView = {
  now: DayItem | null;
  rest: DayItem[];
  pocket: Task[];
  doneCount: number; // выполненные сегодня
  aheadCount: number; // несделанные с датой после сегодня; повторы не считаются
};

// Не localeCompare: ISO-время и id сравниваем побайтно, без правил языка
export function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function byOrder(a: Task, b: Task): number {
  return a.order - b.order || compareStrings(a.createdAt, b.createdAt) || compareStrings(a.id, b.id);
}

/** Задача из «Впереди»: несделанная, с датой после сегодня. */
export function isAhead(task: Task, today: string): task is Task & { date: string } {
  return !task.done && task.date !== null && task.date > today;
}

/** Что показать на экране «Сегодня». */
export function todayView(data: PlannerData): TodayView {
  const rules = new Map(data.rules.map((r) => [r.id, r]));
  const toItem = (task: Task): DayItem => {
    const rule = task.ruleId === undefined ? undefined : rules.get(task.ruleId);
    return { task, repeat: rule === undefined ? null : repeatLabel(rule) };
  };

  const day = data.tasks.filter((t) => t.date === data.today).sort(byOrder);
  const open = day.filter((t) => !t.done);
  const done = day.filter((t) => t.done);
  const [first, ...others] = open;

  return {
    now: first === undefined ? null : toItem(first),
    rest: [...others, ...done].map(toItem),
    pocket: data.tasks
      .filter((t) => t.date === null && !t.done)
      .sort((a, b) => Number(b.returned === true) - Number(a.returned === true) || byOrder(a, b)),
    doneCount: done.length,
    aheadCount: data.tasks.filter((t) => isAhead(t, data.today)).length,
  };
}
