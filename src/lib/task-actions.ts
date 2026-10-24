import type { Changes } from '@/lib/changes';
import type { PlannerData, Task } from '@/lib/types';

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
function pocketToDay(data: PlannerData, task: Task, now: string): Task {
  const { returned, ruleId, ...rest } = task;
  return { ...rest, date: data.today, order: nextOrder(data.tasks, data.today), updatedAt: now };
}

export function moveToToday(data: PlannerData, task: Task, now: string): Changes {
  return { putTasks: [pocketToDay(data, task, now)] };
}

export function markDoneFromPocket(data: PlannerData, task: Task, now: string): Changes {
  return { putTasks: [{ ...pocketToDay(data, task, now), done: true, doneAt: now }] };
}

export function removeTask(task: Task): Changes {
  return { removeTasks: [task.id] };
}
