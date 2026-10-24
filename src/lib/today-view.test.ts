import { applyChanges } from '@/lib/changes';
import { postpone } from '@/lib/task-actions';
import { todayView, type DayItem } from '@/lib/today-view';
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

function rule(overrides: Partial<Rule> & { id: string }): Rule {
  return {
    kind: 'daily',
    title: `правило ${overrides.id}`,
    startDate: '2026-10-01',
    active: true,
    ...overrides,
  } as Rule;
}

function data(tasks: Task[], rules: Rule[] = []): PlannerData {
  return { today: TODAY, tasks, rules };
}

const ids = (items: readonly DayItem[]) => items.map((i) => i.task.id);

describe('todayView: день', () => {
  it('«Сейчас» — первая несделанная; дальше несделанные, потом выполненные', () => {
    const view = todayView(
      data([
        task({ id: 'd', order: 3, done: true }),
        task({ id: 'c', order: 2 }),
        task({ id: 'a', order: 0, done: true }),
        task({ id: 'b', order: 1 }),
      ]),
    );
    expect(view.now?.task.id).toBe('b');
    expect(ids(view.rest)).toEqual(['c', 'a', 'd']);
  });

  it('все выполнены → «Сейчас» пусто, в списке выполненные', () => {
    const view = todayView(
      data([task({ id: 'd', order: 3, done: true }), task({ id: 'a', order: 0, done: true })]),
    );
    expect(view.now).toBeNull();
    expect(ids(view.rest)).toEqual(['a', 'd']);
  });

  it('равный order → по createdAt, потом по id', () => {
    const view = todayView(
      data([
        task({ id: 'x', order: 1, createdAt: '2026-10-02T06:00:00.000Z' }),
        task({ id: 'z', order: 1 }),
        task({ id: 'y', order: 1 }),
      ]),
    );
    expect(view.now?.task.id).toBe('y');
    expect(ids(view.rest)).toEqual(['z', 'x']);
  });

  it('задачи других дней не попадают; «сделано» — только сегодняшние', () => {
    const view = todayView(
      data([
        task({ id: 'a', done: true }),
        task({ id: 'yesterday', date: '2026-10-17', done: true }),
        task({ id: 'tomorrow', date: '2026-10-19' }),
        task({ id: 'pocket', date: null }),
      ]),
    );
    expect(view.now).toBeNull();
    expect(ids(view.rest)).toEqual(['a']);
    expect(view.doneCount).toBe(1);
  });

  it('«Позже» → «Сейчас» становится следующая задача', () => {
    const a = task({ id: 'a', order: 0 });
    const before = data([a, task({ id: 'b', order: 1 })]);
    const view = todayView(applyChanges(before, postpone(before, a, NOW)));
    expect(view.now?.task.id).toBe('b');
    expect(ids(view.rest)).toEqual(['a']);
  });
});

describe('todayView: Карман', () => {
  it('только без даты и несделанные; вернувшиеся сверху', () => {
    const view = todayView(
      data([
        task({ id: 'p1', date: null, order: 0 }),
        task({ id: 'p2', date: null, order: 1, returned: true }),
        task({ id: 'p3', date: null, order: 2, done: true }),
        task({ id: 'today' }),
      ]),
    );
    expect(view.pocket.map((t) => t.id)).toEqual(['p2', 'p1']);
  });
});

describe('todayView: «Впереди»', () => {
  it('считает только несделанные с датой после сегодня', () => {
    const view = todayView(
      data(
        [
          task({ id: 'tomorrow', date: '2026-10-19' }),
          task({ id: 'later', date: '2026-10-25' }),
          task({ id: 'later-done', date: '2026-10-25', done: true }),
          task({ id: 'today' }),
          task({ id: 'past', date: '2026-10-17' }),
          task({ id: 'pocket', date: null }),
        ],
        [rule({ id: 'r1' })],
      ),
    );
    expect(view.aheadCount).toBe(2);
  });
});

describe('todayView: подпись повтора', () => {
  it('экземпляр правила — подпись, иначе null', () => {
    const view = todayView(
      data(
        [
          task({ id: 'walk', order: 0, ruleId: 'r1' }),
          task({ id: 'orphan', order: 1, ruleId: 'gone' }),
          task({ id: 'plain', order: 2 }),
        ],
        [rule({ id: 'r1' })],
      ),
    );
    expect(view.now?.repeat).toBe('каждый день');
    expect(view.rest.map((i) => i.repeat)).toEqual([null, null]);
  });
});
