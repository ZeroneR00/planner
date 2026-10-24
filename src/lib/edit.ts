import type { Changes } from '@/lib/changes';
import { addedHint, whenHint, type Draft, type Hint, type When } from '@/lib/composer';
import { copy } from '@/lib/copy';
import { formatDayBrief } from '@/lib/dates';
import { ruleOccursOn } from '@/lib/rules';
import { addTask, firstOrder, nextOrder, ruleInstance } from '@/lib/task-actions';
import type { PlannerData, RepeatPattern, Rule, Task } from '@/lib/types';

// Правка задачи по тапу. Итог сравниваем с тем, как было в начале правки (origin), меняем только
// то, что изменили в правке, и применяем к текущей задаче: действия во время правки не откатываются.

// Что правим. Тап по экземпляру повтора правит правило — для всех будущих дней
export type EditTarget =
  | { kind: 'task'; taskId: string }
  | { kind: 'rule'; ruleId: string; taskId: string }; // taskId — экземпляр, по которому тапнули
export type EditState = { target: EditTarget; origin: When }; // origin — как было до правки

function patternOf(rule: Rule): RepeatPattern {
  switch (rule.kind) {
    case 'daily':
      return { kind: rule.kind };
    case 'weekdays':
      return { kind: rule.kind };
    case 'weekly':
      return { kind: rule.kind, weekday: rule.weekday };
    case 'monthly':
      return { kind: rule.kind, monthDay: rule.monthDay };
  }
}

export function startEdit(data: PlannerData, task: Task): { edit: EditState; draft: Draft } {
  const rule =
    task.date !== null && task.ruleId !== undefined
      ? data.rules.find((r) => r.id === task.ruleId && r.active)
      : undefined;
  const target: EditTarget =
    rule !== undefined
      ? { kind: 'rule', ruleId: rule.id, taskId: task.id }
      : { kind: 'task', taskId: task.id };
  const title = rule !== undefined ? rule.title : task.title;
  const repeat = rule !== undefined ? patternOf(rule) : null;
  return {
    edit: { target, origin: { title, date: task.date, repeat, fromText: false } },
    draft: {
      text: title,
      date: { manual: true, value: task.date },
      repeat: { manual: true, value: repeat?.kind ?? null },
    },
  };
}

/** День и вид повтора не меняли — повтор прежний: «каждое 31-е», открытое 30 ноября, не станет 30-м. */
export function keepPattern(when: When, origin: When): When {
  if (when.date !== origin.date || when.repeat === null || when.repeat.kind !== origin.repeat?.kind) {
    return when;
  }
  return { ...when, repeat: origin.repeat };
}

function editedTask(data: PlannerData, task: Task, when: When, origin: When, now: string): Task {
  if (when.date === origin.date) {
    if (task.date !== null) return { ...task, title: when.title, updatedAt: now };
    // Как при переносе из Кармана: смена дня заменяет старый пропуск повтора только при returned,
    // иначе в Кармане оказалось бы два экземпляра одного повтора
    const { returned, ruleId, ...rest } = task;
    return { ...rest, title: when.title, updatedAt: now };
  }
  // Перенос = «надо сделать тогда»: отметка «сделано» снимается
  const { returned, ruleId, doneAt, ...rest } = task;
  const order = when.date === null ? firstOrder(data.tasks, null) : nextOrder(data.tasks, when.date);
  return { ...rest, title: when.title, date: when.date, done: false, order, updatedAt: now };
}

function saveTask(
  data: PlannerData,
  task: Task,
  when: When,
  origin: When,
  now: string,
  makeId: () => string,
): Changes {
  if (when.repeat !== null) return { removeTasks: [task.id], ...addTask(data, when, now, makeId) };
  return { putTasks: [editedTask(data, task, when, origin, now)] };
}

function saveRule(
  data: PlannerData,
  rule: Rule,
  instance: Task | undefined,
  when: When,
  origin: When,
  now: string,
  makeId: () => string,
): Changes {
  // «Один раз» или «В карман»: правило выключаем, а не удаляем — на него ссылается история
  if (when.date === null || when.repeat === null) {
    const stopped: Rule = { ...rule, active: false };
    if (instance === undefined) {
      return { putRules: [stopped], ...addTask(data, { ...when, repeat: null }, now, makeId) };
    }
    const { ruleId, ...plain } = instance;
    return { putRules: [stopped], putTasks: [editedTask(data, plain, when, origin, now)] };
  }
  const same = when.date === origin.date && when.repeat.kind === origin.repeat?.kind;
  // Собираем заново, а не спредом rule: при смене вида остался бы старый weekday
  const next: Rule = {
    ...when.repeat,
    id: rule.id,
    title: when.title,
    startDate: same ? rule.startDate : when.date,
    active: true,
  };
  const current = data.tasks.find((t) => t.ruleId === rule.id && t.date === data.today);
  if (current !== undefined) {
    if (current.done || ruleOccursOn(next, data.today)) {
      return { putRules: [next], putTasks: [{ ...current, title: when.title, updatedAt: now }] };
    }
    // Повтор увели с сегодня: несделанный экземпляр уходит, сделанный остаётся историей
    return { putRules: [next], removeTasks: [current.id] };
  }
  if (!ruleOccursOn(next, data.today)) return { putRules: [next] };
  return { putRules: [next], putTasks: [ruleInstance(data, next, now, makeId)] };
}

/** Changes правки; null — задачу или правило уже убрали. */
export function saveEdit(
  data: PlannerData,
  edit: EditState,
  when: When,
  now: string,
  makeId: () => string,
): Changes | null {
  const { target, origin } = edit;
  const w = keepPattern(when, origin);
  const task = data.tasks.find((t) => t.id === target.taskId);
  if (target.kind === 'task') return task === undefined ? null : saveTask(data, task, w, origin, now, makeId);
  const rule = data.rules.find((r) => r.id === target.ruleId);
  return rule === undefined ? null : saveRule(data, rule, task, w, origin, now, makeId);
}

/** Строка над полем в правке — без «понял из текста». */
export function editHint(when: When, today: string, forRule: boolean): Hint {
  if (when.date === null) {
    return { accent: false, parts: [{ text: copy.composer.editToPocket, icon: 'arrowRight' }] };
  }
  const hint = whenHint({ ...when, fromText: false }, today);
  if (!forRule || when.repeat === null) return hint;
  return { ...hint, parts: [...hint.parts, { text: copy.composer.forAllRepeats }] };
}

/** Строка над полем после правки — до следующей буквы. */
export function savedHint(edit: EditState, when: When, today: string): Hint {
  const w = keepPattern(when, edit.origin);
  if (edit.target.kind === 'rule') {
    const text = w.date !== null && w.repeat !== null ? copy.composer.savedRule : copy.composer.repeatStopped;
    return { accent: false, parts: [{ text }] };
  }
  if (w.repeat === null && w.date === edit.origin.date) {
    return { accent: false, parts: [{ text: copy.composer.saved }] };
  }
  return addedHint(w, today);
}

/** Текст плашки «Вернуть» после правки: только если задачу перенесли на другой день. */
export function editUndoText(edit: EditState, when: When, today: string): string | null {
  const w = keepPattern(when, edit.origin);
  if (edit.target.kind !== 'task' || w.date === edit.origin.date || w.date === null) return null;
  return copy.undo.moved(formatDayBrief(w.date, today), w.title);
}
