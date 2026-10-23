import { applyChanges } from '@/lib/changes';
import type { PlannerData, Rule, Task } from '@/lib/types';

const TODAY = '2026-10-18';
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

function rule(overrides: Partial<Rule> & { id: string }): Rule {
  return {
    kind: 'daily',
    title: `правило ${overrides.id}`,
    startDate: '2026-10-01',
    active: true,
    ...overrides,
  } as Rule;
}

function data(): PlannerData {
  return {
    today: TODAY,
    tasks: [task({ id: 'a' }), task({ id: 'b' }), task({ id: 'c' })],
    rules: [rule({ id: 'r1' }), rule({ id: 'r2' })],
  };
}

const ids = (list: readonly { id: string }[]) => list.map((x) => x.id);

describe('applyChanges', () => {
  it('put новой задачи — в конец списка', () => {
    const result = applyChanges(data(), { putTasks: [task({ id: 'd' })] });
    expect(ids(result.tasks)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('put существующей — заменяет на своём месте', () => {
    const changed = task({ id: 'b', title: 'новое' });
    const result = applyChanges(data(), { putTasks: [changed] });
    expect(ids(result.tasks)).toEqual(['a', 'b', 'c']);
    expect(result.tasks[1]).toBe(changed);
  });

  it('remove убирает задачу', () => {
    const result = applyChanges(data(), { removeTasks: ['b'] });
    expect(ids(result.tasks)).toEqual(['a', 'c']);
  });

  it('remove и put одного id — put побеждает', () => {
    const changed = task({ id: 'b', title: 'новое' });
    const result = applyChanges(data(), { removeTasks: ['b'], putTasks: [changed] });
    expect(result.tasks).toContain(changed);
    expect(result.tasks).toHaveLength(3);
  });

  it('то же для правил', () => {
    const changed = rule({ id: 'r1', title: 'новое' });
    const result = applyChanges(data(), {
      putRules: [changed, rule({ id: 'r3' })],
      removeRules: ['r2'],
    });
    expect(ids(result.rules)).toEqual(['r1', 'r3']);
    expect(result.rules[0]).toBe(changed);
  });

  it('не мутирует вход', () => {
    const source = data();
    Object.freeze(source.tasks);
    Object.freeze(source.rules);
    Object.freeze(source);
    const putTasks = Object.freeze([task({ id: 'a', title: 'новое' }), task({ id: 'd' })]);
    const removeTasks = Object.freeze(['b']);
    const putRules = Object.freeze([rule({ id: 'r3' })]);
    const removeRules = Object.freeze(['r1']);

    const result = applyChanges(source, { putTasks, removeTasks, putRules, removeRules });

    expect(ids(source.tasks)).toEqual(['a', 'b', 'c']);
    expect(ids(source.rules)).toEqual(['r1', 'r2']);
    expect(ids(result.tasks)).toEqual(['a', 'c', 'd']);
    expect(ids(result.rules)).toEqual(['r2', 'r3']);
    expect(result.today).toBe(TODAY);
  });

  it('пустые изменения — данные те же', () => {
    expect(applyChanges(data(), {})).toEqual(data());
  });
});
