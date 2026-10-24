import type { PlannerData, Rule, Task } from '@/lib/types';

/** Единственный способ поменять данные: база и память применяют одно и то же. */
export type Changes = {
  putTasks?: readonly Task[]; // вставить или заменить целиком по id
  removeTasks?: readonly string[];
  putRules?: readonly Rule[];
  removeRules?: readonly string[];
};

// Сначала удалить, потом записать — в том же порядке, что и writeChanges в базе,
// поэтому remove и put одного id дают одинаковый итог: put побеждает
function applyTo<T extends { id: string }>(
  list: readonly T[],
  put: readonly T[] = [],
  remove: readonly string[] = [],
): T[] {
  const removed = new Set(remove);
  const result = list.filter((item) => !removed.has(item.id));
  for (const item of put) {
    const i = result.findIndex((x) => x.id === item.id);
    if (i === -1) result.push(item);
    else result[i] = item;
  }
  return result;
}

// Каждый затронутый id: был — вернуть старую версию, не было — удалить
function invertFor<T extends { id: string }>(
  list: readonly T[],
  put: readonly T[] = [],
  remove: readonly string[] = [],
): { put: T[]; remove: string[] } {
  const touched = new Set([...remove, ...put.map((item) => item.id)]);
  const result = { put: [] as T[], remove: [] as string[] };
  for (const id of touched) {
    const before = list.find((item) => item.id === id);
    if (before === undefined) result.remove.push(id);
    else result.put.push(before);
  }
  return result;
}

/** Обратные Changes, посчитанные от состояния до действия: из них собирается «Вернуть». */
export function invertChanges(data: PlannerData, changes: Changes): Changes {
  const tasks = invertFor(data.tasks, changes.putTasks, changes.removeTasks);
  const rules = invertFor(data.rules, changes.putRules, changes.removeRules);
  return { putTasks: tasks.put, removeTasks: tasks.remove, putRules: rules.put, removeRules: rules.remove };
}

export function applyChanges(data: PlannerData, changes: Changes): PlannerData {
  return {
    ...data,
    tasks: applyTo(data.tasks, changes.putTasks, changes.removeTasks),
    rules: applyTo(data.rules, changes.putRules, changes.removeRules),
  };
}
