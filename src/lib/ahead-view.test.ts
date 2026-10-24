import { aheadView } from '@/lib/ahead-view';
import type { PlannerData, Rule, Task } from '@/lib/types';

const TODAY = '2026-10-24'; // суббота
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

describe('aheadView: дни', () => {
  const tasks = [
    task({ id: 'tue2', date: '2026-10-27', order: 2 }),
    task({ id: 'sun', date: '2026-10-25' }),
    task({ id: 'tue1', date: '2026-10-27', order: 1 }),
    task({ id: 'today' }),
    task({ id: 'past', date: '2026-10-20' }),
    task({ id: 'sticker', date: null }),
    task({ id: 'done', date: '2026-10-27', done: true }),
  ];

  it('только несделанные после сегодня, дни по возрастанию, внутри дня — по order', () => {
    const { days } = aheadView(data(tasks));
    expect(days.map((d) => [d.date, d.tasks.map((t) => t.id)])).toEqual([
      ['2026-10-25', ['sun']],
      ['2026-10-27', ['tue1', 'tue2']],
    ]);
  });

  it('подписи дней', () => {
    expect(aheadView(data(tasks)).days.map((d) => d.label)).toEqual([
      'Завтра, вс, 25 октября',
      'Вт, 27 октября',
    ]);
  });

  it('пусто', () => {
    expect(aheadView(data([]))).toEqual({ days: [], rules: [] });
  });
});

describe('aheadView: повторы', () => {
  const labels = (rules: Rule[]) => aheadView(data([], rules)).rules.map((r) => r.label);

  it('следующий день — первый после сегодня', () => {
    expect(
      labels([
        rule({ id: 'd' }),
        rule({ id: 'tue', kind: 'weekly', weekday: 2 }),
        rule({ id: 'sat', kind: 'weekly', weekday: 6 }),
      ]),
    ).toEqual([
      'каждый день · следующий — завтра',
      'каждый вт · следующий — вт, 27 октября',
      'каждую сб · следующий — сб, 31 октября',
    ]);
  });

  it('не раньше начала правила', () => {
    expect(labels([rule({ id: 'tue', kind: 'weekly', weekday: 2, startDate: '2026-11-03' })])).toEqual([
      'каждый вт · следующий — вт, 3 ноября',
    ]);
  });

  it('остановленные не показываем', () => {
    const r = rule({ id: 'on' });
    expect(aheadView(data([], [r, rule({ id: 'off', active: false })])).rules.map((x) => x.rule)).toEqual([r]);
  });
});
