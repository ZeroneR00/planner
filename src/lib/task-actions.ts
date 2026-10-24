import type { Changes } from '@/lib/changes';
import type { When } from '@/lib/composer';
import { ruleOccursOn } from '@/lib/rules';
import type { PlannerData, Rule, Task } from '@/lib/types';

// Действия с задачей с экрана «Сегодня». Возвращают Changes, а не пишут сами:
// так отмену (плашку «Вернуть») можно будет собрать из обратных Changes.

/** Следующий order в дне (date — дата или null для Кармана). Пустой день → 0. */
export function nextOrder(tasks: readonly Task[], date: string | null): number {
  let max = -1;
  for (const t of tasks) {
    if (t.date === date && t.order > max) max = t.order;
  }
  return max + 1;
}

/** order, с которым задача встаёт первой в дне (или в Кармане). Пустой день → 0. */
export function firstOrder(tasks: readonly Task[], date: string | null): number {
  let min = Infinity;
  for (const t of tasks) {
    if (t.date === date && t.order < min) min = t.order;
  }
  return min === Infinity ? 0 : min - 1;
}

/**
 * Новая задача из поля записи. Карман — сверху, день — в конец.
 * Повтор — правило и, если оно срабатывает сегодня, экземпляр на сегодня.
 */
export function addTask(data: PlannerData, when: When, now: string, makeId: () => string): Changes {
  const base = { title: when.title, done: false, createdAt: now, updatedAt: now };
  const { date, repeat } = when;
  if (date === null) {
    return { putTasks: [{ id: makeId(), ...base, date, order: firstOrder(data.tasks, null) }] };
  }
  if (repeat === null) {
    return { putTasks: [{ id: makeId(), ...base, date, order: nextOrder(data.tasks, date) }] };
  }
  const rule: Rule = { ...repeat, id: makeId(), title: when.title, startDate: date, active: true };
  // Смена дня пока только при запуске — экземпляр на сегодня создаём сразу, будущие создаст она
  if (!ruleOccursOn(rule, data.today)) return { putRules: [rule] };
  return { putRules: [rule], putTasks: [ruleInstance(data, rule, now, makeId)] };
}

/** Экземпляр правила на сегодня — в конец дня. */
export function ruleInstance(data: PlannerData, rule: Rule, now: string, makeId: () => string): Task {
  return {
    id: makeId(),
    title: rule.title,
    date: data.today,
    done: false,
    order: nextOrder(data.tasks, data.today),
    ruleId: rule.id,
    createdAt: now,
    updatedAt: now,
  };
}

export function toggleDone(task: Task, now: string): Changes {
  if (!task.done) return { putTasks: [{ ...task, done: true, doneAt: now, updatedAt: now }] };
  // Ключ убираем совсем, а не ставим undefined, — как задача, прочитанная из базы
  const { doneAt, ...rest } = task;
  return { putTasks: [{ ...rest, done: false, updatedAt: now }] };
}

export function postpone(data: PlannerData, task: Task, now: string): Changes {
  return { putTasks: [{ ...task, order: nextOrder(data.tasks, data.today), updatedAt: now }] };
}

// Из Кармана в конец дня. ruleId и returned снимаем: иначе вернувшийся экземпляр повтора
// и сегодняшний экземпляр того же правила показали бы два «↻» в одном дне
function pocketToDay(data: PlannerData, task: Task, date: string, now: string): Task {
  const { returned, ruleId, ...rest } = task;
  return { ...rest, date, order: nextOrder(data.tasks, date), updatedAt: now };
}

export function moveToDay(data: PlannerData, task: Task, date: string, now: string): Changes {
  return { putTasks: [pocketToDay(data, task, date, now)] };
}

export function markDoneFromPocket(data: PlannerData, task: Task, now: string): Changes {
  return { putTasks: [{ ...pocketToDay(data, task, data.today, now), done: true, doneAt: now }] };
}

export function removeTask(task: Task): Changes {
  return { removeTasks: [task.id] };
}

/**
 * «Остановить» повтор: правило выключаем, а не удаляем — на него ссылается история.
 * Экземпляр на сегодня остаётся обычной задачей.
 */
export function stopRule(data: PlannerData, rule: Rule, now: string): Changes {
  const instances = data.tasks
    .filter((t) => t.ruleId === rule.id && t.date === data.today)
    .map(({ ruleId, ...rest }) => ({ ...rest, updatedAt: now }));
  return { putRules: [{ ...rule, active: false }], putTasks: instances };
}
