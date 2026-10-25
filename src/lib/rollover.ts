import { ruleOccursOn } from '@/lib/rules';
import { placeInDay, withTime } from '@/lib/task-actions';
import type { Rule, Task } from '@/lib/types';

export type RolloverInput = {
  tasks: readonly Task[];
  rules: readonly Rule[];
  today: string;
  /** ISO-время для createdAt/updatedAt — снаружи, чтобы функция была чистой. */
  now: string;
  makeId: () => string;
};

export type RolloverDiff = {
  created: Task[];
  updated: Task[];
  removed: string[];
};

type DatedTask = Task & { date: string };

/**
 * Смена дня: несделанное из прошлых дней — в Карман, повторы — экземпляры на сегодня.
 * Идемпотентна: на уже применённом результате возвращает пустой diff.
 */
export function rollover({ tasks, rules, today, now, makeId }: RolloverInput): RolloverDiff {
  const created: Task[] = [];
  const updated: Task[] = [];
  const removed: string[] = [];

  // Время без дня бессмысленно — в стикерах его нет
  const toPocket = (task: Task) => {
    updated.push({ ...withTime(task, null), date: null, returned: true, updatedAt: now });
  };

  // Выполненное из прошлых дней не трогаем — его скрывает запрос экрана
  const missed = tasks.filter((t): t is DatedTask => !t.done && t.date !== null && t.date < today);

  const missedByRule = new Map<string, DatedTask[]>();
  for (const task of missed) {
    if (task.ruleId === undefined) {
      toPocket(task);
      continue;
    }
    const group = missedByRule.get(task.ruleId) ?? [];
    group.push(task);
    missedByRule.set(task.ruleId, group);
  }

  // В Кармане остаётся не больше одного пропуска на правило — самый поздний:
  // десять несделанных «зарядок» там никому не нужны
  for (const [ruleId, group] of missedByRule) {
    const latest = group.reduce((a, b) => (b.date > a.date ? b : a));
    toPocket(latest);
    for (const task of group) {
      if (task !== latest) removed.push(task.id);
    }
    for (const task of tasks) {
      if (task.ruleId === ruleId && task.date === null && task.returned === true && !task.done) {
        removed.push(task.id);
      }
    }
  }

  const todays = tasks.filter((t) => t.date === today);
  // Рабочий список дня: экземпляр со временем встаёт по часам и сдвигает тех, кто ниже
  const day = new Map(todays.map((t) => [t.id, t]));
  const createdIds: string[] = [];
  for (const rule of rules) {
    if (!ruleOccursOn(rule, today)) continue;
    // Экземпляр уже есть — даже выполненный — значит, на сегодня повтор создан
    if (todays.some((t) => t.ruleId === rule.id)) continue;
    const time = rule.time ?? null;
    const { order, shifted } = placeInDay([...day.values()], today, time);
    for (const t of shifted) day.set(t.id, t);
    const instance: Task = {
      id: makeId(),
      title: rule.title,
      date: today,
      done: false,
      order,
      ruleId: rule.id,
      createdAt: now,
      updatedAt: now,
    };
    day.set(instance.id, withTime(instance, time));
    createdIds.push(instance.id);
  }
  for (const id of createdIds) {
    const task = day.get(id);
    if (task !== undefined) created.push(task);
  }
  for (const task of todays) {
    const placed = day.get(task.id);
    if (placed !== undefined && placed.order !== task.order) updated.push(placed);
  }

  return { created, updated, removed };
}
