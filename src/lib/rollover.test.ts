import { rollover, type RolloverDiff } from '@/lib/rollover';
import type { Rule, Task } from '@/lib/types';

const TODAY = '2026-10-18';
const NOW = '2026-10-18T06:00:00.000Z';
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

function run(tasks: Task[], rules: Rule[] = []): RolloverDiff {
  let n = 0;
  return rollover({ tasks, rules, today: TODAY, now: NOW, makeId: () => `new-${++n}` });
}

function applyDiff(tasks: Task[], diff: RolloverDiff): Task[] {
  const updatedById = new Map(diff.updated.map((t) => [t.id, t]));
  return [
    ...tasks.filter((t) => !diff.removed.includes(t.id)).map((t) => updatedById.get(t.id) ?? t),
    ...diff.created,
  ];
}

const EMPTY: RolloverDiff = { created: [], updated: [], removed: [] };
const pocketed = { date: null, returned: true, updatedAt: NOW };

describe('rollover', () => {
  it('1: несделанное из прошлых дней уходит в Карман', () => {
    const yesterday = task({ id: 'a', date: '2026-10-17' });
    const old = task({ id: 'b', date: '2026-10-15' });
    expect(run([yesterday, old])).toEqual({
      ...EMPTY,
      updated: [
        { ...yesterday, ...pocketed },
        { ...old, ...pocketed },
      ],
    });
  });

  it('2: выполненное, сегодняшнее, будущее и Карман не трогаются', () => {
    const tasks = [
      task({ id: 'done', date: '2026-10-17', done: true, doneAt: '2026-10-17T10:00:00.000Z' }),
      task({ id: 'today' }),
      task({ id: 'future', date: '2026-10-25' }),
      task({ id: 'pocket', date: null }),
    ];
    expect(run(tasks)).toEqual(EMPTY);
  });

  it('3: создаёт экземпляр повтора после сегодняшних задач', () => {
    const diff = run([task({ id: 'a', order: 3 }), task({ id: 'b', order: 5 })], [rule({ id: 'r' })]);
    expect(diff.created).toEqual([
      {
        id: 'new-1',
        title: 'правило r',
        date: TODAY,
        done: false,
        order: 6,
        ruleId: 'r',
        createdAt: NOW,
        updatedAt: NOW,
      },
    ]);
  });

  it('3: без сегодняшних задач order = 0, у нескольких экземпляров растёт', () => {
    const diff = run([], [rule({ id: 'r1' }), rule({ id: 'r2' })]);
    expect(diff.created.map((t) => [t.id, t.ruleId, t.order])).toEqual([
      ['new-1', 'r1', 0],
      ['new-2', 'r2', 1],
    ]);
  });

  it('4: экземпляр на сегодня уже есть, даже выполненный', () => {
    const tasks = [task({ id: 'i', ruleId: 'r', done: true, doneAt: NOW })];
    expect(run(tasks, [rule({ id: 'r' })])).toEqual(EMPTY);
  });

  it('5: правило не на сегодня, неактивное или ещё не началось', () => {
    const rules = [
      // 18.10 — воскресенье
      rule({ id: 'mon', kind: 'weekly', weekday: 1 }),
      rule({ id: 'off', active: false }),
      rule({ id: 'later', startDate: '2026-10-19' }),
    ];
    expect(run([], rules)).toEqual(EMPTY);
  });

  it('6: пропущенный вчерашний экземпляр — в Карман, на сегодня — новый', () => {
    const missed = task({ id: 'i', ruleId: 'r', date: '2026-10-17' });
    const diff = run([missed], [rule({ id: 'r' })]);
    expect(diff.updated).toEqual([{ ...missed, ...pocketed }]);
    expect(diff.removed).toEqual([]);
    expect(diff.created).toMatchObject([{ ruleId: 'r', date: TODAY }]);
  });

  it('7: старый пропуск из Кармана заменяется новым', () => {
    const inPocket = task({ id: 'old', ruleId: 'r', date: null, returned: true });
    const missed = task({ id: 'i', ruleId: 'r', date: '2026-10-17' });
    const diff = run([inPocket, missed], [rule({ id: 'r' })]);
    expect(diff.updated).toEqual([{ ...missed, ...pocketed }]);
    expect(diff.removed).toEqual(['old']);
  });

  it('8: из нескольких пропусков одного правила в Карман идёт самый поздний', () => {
    const early = task({ id: 'early', ruleId: 'r', date: '2026-10-16' });
    const late = task({ id: 'late', ruleId: 'r', date: '2026-10-17' });
    const diff = run([late, early], [rule({ id: 'r' })]);
    expect(diff.updated).toEqual([{ ...late, ...pocketed }]);
    expect(diff.removed).toEqual(['early']);
  });

  it('9: пропуск в Кармане без нового пропуска не трогается', () => {
    const inPocket = task({ id: 'old', ruleId: 'r', date: null, returned: true });
    const instance = task({ id: 'i', ruleId: 'r' });
    expect(run([inPocket, instance], [rule({ id: 'r' })])).toEqual(EMPTY);
  });

  it('10: повторный запуск на применённом результате — пустой diff', () => {
    const tasks = [
      task({ id: 'a', date: '2026-10-15' }),
      task({ id: 'old', ruleId: 'r', date: null, returned: true }),
      task({ id: 'early', ruleId: 'r', date: '2026-10-16' }),
      task({ id: 'late', ruleId: 'r', date: '2026-10-17' }),
      task({ id: 'today', order: 2 }),
    ];
    const rules = [rule({ id: 'r' }), rule({ id: 'w', kind: 'weekly', weekday: 0 })];
    const first = run(tasks, rules);
    expect(first).not.toEqual(EMPTY);
    expect(run(applyDiff(tasks, first), rules)).toEqual(EMPTY);
  });
});
