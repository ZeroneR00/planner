import { applyChanges, invertChanges, type Changes } from '@/lib/changes';
import type { When } from '@/lib/composer';
import {
  addTask,
  firstOrder,
  markDoneFromPocket,
  moveToDay,
  nextOrder,
  postpone,
  removeTask,
  stopRule,
  toggleDone,
} from '@/lib/task-actions';
import type { PlannerData, Rule, Task } from '@/lib/types';

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
  const tasks = [p, task({ id: 'a', order: 4 }), task({ id: 'b', date: '2026-10-21', order: 1 })];
  const moved = {
    id: 'p',
    title: 'p',
    date: TODAY,
    done: false,
    order: 5,
    createdAt: BEFORE,
    updatedAt: NOW,
  };

  it('moveToDay на сегодня: в конец дня, без returned и ruleId', () => {
    const result = only(moveToDay(data(tasks), p, TODAY, NOW));
    expect(result).toEqual(moved);
    expect(result).not.toHaveProperty('returned');
    expect(result).not.toHaveProperty('ruleId');
  });

  it('moveToDay на будущую дату: в конец той даты', () => {
    const result = only(moveToDay(data(tasks), p, '2026-10-21', NOW));
    expect(result).toEqual({ ...moved, date: '2026-10-21', order: 2 });
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

describe('stopRule', () => {
  const r: Rule = { id: 'r', title: 'прогулка', kind: 'daily', startDate: '2026-10-01', active: true };
  const stopped = { ...r, active: false };

  it('несделанный экземпляр на сегодня — обычная задача', () => {
    const inst = task({ id: 'i', ruleId: 'r', order: 3 });
    expect(stopRule({ ...data([inst]), rules: [r] }, r, NOW)).toEqual({
      putRules: [stopped],
      putTasks: [{ ...task({ id: 'i', order: 3 }), updatedAt: NOW }],
    });
  });

  it('сделанный экземпляр — тоже без повтора, отметка остаётся', () => {
    const inst = task({ id: 'i', ruleId: 'r', done: true, doneAt: NOW });
    expect(stopRule({ ...data([inst]), rules: [r] }, r, NOW).putTasks).toEqual([
      { ...task({ id: 'i', done: true, doneAt: NOW }), updatedAt: NOW },
    ]);
  });

  it('без экземпляра — только правило; прошлые и стикеры не трогаем', () => {
    const tasks = [
      task({ id: 'past', date: '2026-10-17', ruleId: 'r' }),
      task({ id: 'sticker', date: null, ruleId: 'r', returned: true }),
      task({ id: 'other', ruleId: 'r2' }),
    ];
    expect(stopRule({ ...data(tasks), rules: [r] }, r, NOW)).toEqual({ putRules: [stopped], putTasks: [] });
  });

  it('отмена возвращает как было', () => {
    const before: PlannerData = { ...data([task({ id: 'i', ruleId: 'r' })]), rules: [r] };
    const changes = stopRule(before, r, NOW);
    expect(applyChanges(applyChanges(before, changes), invertChanges(before, changes))).toEqual(before);
  });
});

describe('firstOrder', () => {
  it('min − 1 среди задач этой даты, пусто → 0', () => {
    const tasks = [task({ id: 'a', date: null, order: 3 }), task({ id: 'b', order: -5 })];
    expect(firstOrder(tasks, null)).toBe(2);
    expect(firstOrder(tasks, '2026-10-25')).toBe(0);
  });
});

describe('addTask', () => {
  let n = 0;
  const makeId = () => `id${++n}`;
  beforeEach(() => {
    n = 0;
  });

  const tasks = [
    task({ id: 'p0', date: null, order: 0 }),
    task({ id: 'p2', date: null, order: 2 }),
    task({ id: 'a', order: 4 }),
    task({ id: 'later', date: '2026-10-21', order: 1 }),
  ];

  function when(overrides: Partial<When>): When {
    return { title: 'купить хлеб', date: null, repeat: null, fromText: false, ...overrides };
  }

  const fresh = { title: 'купить хлеб', done: false, createdAt: NOW, updatedAt: NOW };

  it('в Карман — сверху', () => {
    expect(addTask(data(tasks), when({}), NOW, makeId)).toEqual({
      putTasks: [{ id: 'id1', ...fresh, date: null, order: -1 }],
    });
  });

  it('на сегодня — в конец дня', () => {
    expect(only(addTask(data(tasks), when({ date: TODAY }), NOW, makeId))).toEqual({
      id: 'id1',
      ...fresh,
      date: TODAY,
      order: 5,
    });
  });

  it('на будущий день — в конец своего дня', () => {
    expect(only(addTask(data(tasks), when({ date: '2026-10-21' }), NOW, makeId)).order).toBe(2);
  });

  it('повтор, который срабатывает сегодня, — правило и экземпляр на сегодня', () => {
    const changes = addTask(data(tasks), when({ date: TODAY, repeat: { kind: 'daily' } }), NOW, makeId);
    const rule: Rule = {
      kind: 'daily',
      id: 'id1',
      title: 'купить хлеб',
      startDate: TODAY,
      active: true,
    };
    expect(changes).toEqual({
      putRules: [rule],
      putTasks: [{ id: 'id2', ...fresh, date: TODAY, order: 5, ruleId: 'id1' }],
    });
  });

  it('повтор с будущей даты — только правило', () => {
    const repeat = { kind: 'weekly', weekday: 3 } as const;
    const changes = addTask(data(tasks), when({ date: '2026-10-21', repeat }), NOW, makeId);
    expect(changes).toEqual({
      putRules: [{ ...repeat, id: 'id1', title: 'купить хлеб', startDate: '2026-10-21', active: true }],
    });
  });
});
