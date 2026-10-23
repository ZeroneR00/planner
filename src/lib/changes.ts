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

export function applyChanges(data: PlannerData, changes: Changes): PlannerData {
  return {
    ...data,
    tasks: applyTo(data.tasks, changes.putTasks, changes.removeTasks),
    rules: applyTo(data.rules, changes.putRules, changes.removeRules),
  };
}
