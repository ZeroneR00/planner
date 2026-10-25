import type { Changes } from '@/lib/changes';
import type { When } from '@/lib/composer';
import { ruleOccursOn } from '@/lib/rules';
import { byOrder } from '@/lib/today-view';
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
 * Место в дне «по часам при записи»: перед первой несделанной задачей с более поздним временем,
 * иначе в конец. Задачи с этого места и ниже сдвигаются на 1 — их тоже нужно записать.
 * skipId — сама задача при правке и переносе.
 */
export function placeInDay(
  tasks: readonly Task[],
  date: string,
  time: string | null,
  skipId?: string,
): { order: number; shifted: Task[] } {
  const day = tasks.filter((t) => t.date === date && t.id !== skipId).sort(byOrder);
  const end = { order: nextOrder(day, date), shifted: [] };
  if (time === null) return end;
  // Строго позже: при одинаковом времени новая встаёт после старой
  const anchor = day.find((t) => !t.done && t.time !== undefined && t.time > time);
  if (anchor === undefined) return end;
  // updatedAt у сдвинутых не трогаем: это не их правка
  const shifted = day.filter((t) => t.order >= anchor.order).map((t) => ({ ...t, order: t.order + 1 }));
  return { order: anchor.order, shifted };
}

/**
 * Задача или правило с этим временем. null — ключ убираем совсем, а не ставим undefined:
 * так же выглядит задача, прочитанная из базы.
 */
export function withTime<T extends { time?: string }>(item: T, time: string | null): T {
  const { time: _old, ...rest } = item;
  return time === null ? (rest as T) : { ...item, time };
}

/** Задача или правило с этим фото; undefined — без ключа, как withTime. */
export function withPhoto<T extends { photo?: string }>(item: T, photo: string | undefined): T {
  const { photo: _old, ...rest } = item;
  return photo === undefined ? (rest as T) : { ...item, photo };
}

/**
 * Новая задача из поля записи. Карман — сверху, день — по часам или в конец.
 * Повтор — правило и, если оно срабатывает сегодня, экземпляр на сегодня.
 * photo — имя файла снимка: у повтора оно на правиле и переходит в экземпляры.
 */
export function addTask(
  data: PlannerData,
  when: When,
  now: string,
  makeId: () => string,
  photo?: string,
): Changes {
  const base = { title: when.title, done: false, createdAt: now, updatedAt: now };
  const { date, repeat } = when;
  if (date === null) {
    const task: Task = { id: makeId(), ...base, date, order: firstOrder(data.tasks, null) };
    return { putTasks: [withPhoto(task, photo)] };
  }
  if (repeat === null) {
    const { order, shifted } = placeInDay(data.tasks, date, when.time);
    const task: Task = { id: makeId(), ...base, date, order };
    return { putTasks: [withPhoto(withTime(task, when.time), photo), ...shifted] };
  }
  const rule = withPhoto(
    withTime<Rule>({ ...repeat, id: makeId(), title: when.title, startDate: date, active: true }, when.time),
    photo,
  );
  // Смена дня пока только при запуске — экземпляр на сегодня создаём сразу, будущие создаст она
  if (!ruleOccursOn(rule, data.today)) return { putRules: [rule] };
  return { putRules: [rule], putTasks: ruleInstance(data, rule, now, makeId) };
}

/** Экземпляр правила на сегодня — по часам или в конец дня; за ним — сдвинутые задачи. */
export function ruleInstance(data: PlannerData, rule: Rule, now: string, makeId: () => string): Task[] {
  const { order, shifted } = placeInDay(data.tasks, data.today, rule.time ?? null);
  const task: Task = {
    id: makeId(),
    title: rule.title,
    date: data.today,
    done: false,
    order,
    ruleId: rule.id,
    createdAt: now,
    updatedAt: now,
  };
  return [withPhoto(withTime(task, rule.time ?? null), rule.photo), ...shifted];
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
