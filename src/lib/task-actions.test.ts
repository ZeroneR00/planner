import type { Changes } from '@/lib/changes';
import {
  markDoneFromPocket,
  moveToToday,
  nextOrder,
  postpone,
  removeTask,
  toggleDone,
} from '@/lib/task-actions';
import type { PlannerData, Task } from '@/lib/types';

const TODAY = '2026-10-18';
const NOW = '2026-10-18T09:30:00.000Z';
const BEFORE = '2026-10-01T06:00:00.000Z';

function task(overrides: Partial<Task> & { id: string }): Task {
  return {
    title: overrides.id,
    date: TODAY,
    done: false,
    order: 0,
    createdAt: BEFORE,
    updatedAt: BEFORE,
    ...overrides,
  };
}

function data(tasks: Task[]): PlannerData {
  return { today: TODAY, tasks, rules: [] };
}

/** Единственная задача из putTasks. */
function only(changes: Changes): Task {
  expect(changes.removeTasks).toBeUndefined();
  expect(changes.putTasks).toHaveLength(1);
  const [t] = changes.putTasks ?? [];
  if (t === undefined) throw new Error('нет задачи в putTasks');
  return t;
}

describe('nextOrder', () => {
  const tasks = [
    task({ id: 'a', order: 2 }),
    task({ id: 'b', order: 5 }),
    task({ id: 'tomorrow', date: '2026-10-19', order: 9 }),
    task({ id: 'pocket', date: null, order: 7 }),
  ];

  it('пустой день → 0', () => {
    expect(nextOrder([], TODAY)).toBe(0);
    expect(nextOrder(tasks, '2026-10-25')).toBe(0);
  });

  it('max + 1 только среди задач этой даты', () => {
    expect(nextOrder(tasks, TODAY)).toBe(6);
  });

  it('для null — по Карману', () => {
    expect(nextOrder(tasks, null)).toBe(8);
  });
});

describe('toggleDone', () => {
  it('несделанная → сделана сейчас', () => {
    const t = task({ id: 'a' });
    expect(only(toggleDone(t, NOW))).toEqual({ ...t, done: true, doneAt: NOW, updatedAt: NOW });
  });

  it('сделанная → не сделана, ключа doneAt нет', () => {
    const t = task({ id: 'a', done: true, doneAt: BEFORE });
    const result = only(toggleDone(t, NOW));
    expect(result.done).toBe(false);
    expect(result.updatedAt).toBe(NOW);
    expect(result).not.toHaveProperty('doneAt');
  });
});

describe('postpone', () => {
  it('ставит в конец дня, остальное не трогает', () => {
    const a = task({ id: 'a', order: 0 });
    const tasks = [a, task({ id: 'b', order: 1 }), task({ id: 'tomorrow', date: '2026-10-19', order: 9 })];
    expect(only(postpone(data(tasks), a, NOW))).toEqual({ ...a, order: 2, updatedAt: NOW });
  });
});

describe('из Кармана в день', () => {
  const p = task({ id: 'p', date: null, order: 0, returned: true, ruleId: 'r1' });
  const tasks = [p, task({ id: 'a', order: 4 })];
  const moved = {
    id: 'p',
    title: 'p',
    date: TODAY,
    done: false,
    order: 5,
    createdAt: BEFORE,
    updatedAt: NOW,
  };

  it('moveToToday: дата — сегодня, в конец дня, без returned и ruleId', () => {
    const result = only(moveToToday(data(tasks), p, NOW));
    expect(result).toEqual(moved);
    expect(result).not.toHaveProperty('returned');
    expect(result).not.toHaveProperty('ruleId');
  });

  it('markDoneFromPocket: то же и сделана сейчас', () => {
    const result = only(markDoneFromPocket(data(tasks), p, NOW));
    expect(result).toEqual({ ...moved, done: true, doneAt: NOW });
    expect(result).not.toHaveProperty('returned');
    expect(result).not.toHaveProperty('ruleId');
  });
});

describe('removeTask', () => {
  it('удаляет по id', () => {
    expect(removeTask(task({ id: 'p' }))).toEqual({ removeTasks: ['p'] });
  });
});
