import { MAX_REMINDERS, diffReminders, planReminders, type Reminder } from '@/lib/reminders';
import type { Rule, Task } from '@/lib/types';

const TODAY = '2026-10-18'; // воскресенье
const NOW = { date: TODAY, time: '10:00' };
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
    time: '19:00',
    ...overrides,
  } as Rule;
}

function plan(tasks: Task[], rules: Rule[] = []): Reminder[] {
  return planReminders({ tasks, rules }, NOW);
}

describe('planReminders: задачи', () => {
  it('задача сегодня в 15:00 — одно напоминание', () => {
    expect(plan([task({ id: 'a', title: 'созвон', time: '15:00' })])).toEqual([
      { id: 't:a:2026-10-18T15:00', title: 'созвон', date: TODAY, time: '15:00' },
    ]);
  });

  it('без напоминания: время прошло, сделано, без времени, в стикерах', () => {
    expect(
      plan([
        task({ id: 'past', time: '09:00' }),
        task({ id: 'now', time: '10:00' }),
        task({ id: 'done', time: '15:00', done: true }),
        task({ id: 'plain' }),
        task({ id: 'pocket', date: null }),
      ]),
    ).toEqual([]);
  });

  it('задача через месяц — тоже ставится', () => {
    expect(plan([task({ id: 'doc', date: '2026-11-18', time: '09:00' })]).map((r) => r.id)).toEqual([
      't:doc:2026-11-18T09:00',
    ]);
  });

  it('фото без подписи — напоминание «Фото»', () => {
    expect(plan([task({ id: 'f', title: '', photo: 'a.jpg', time: '15:00' })])[0]?.title).toBe('Фото');
  });
});

describe('planReminders: повторы', () => {
  it('daily 19:00 с несделанным экземпляром сегодня — 1 от задачи и 13 от правила', () => {
    const r = rule({ id: 'r', title: 'зарядка' });
    const instance = task({ id: 'i', title: 'зарядка', ruleId: 'r', time: '19:00' });
    const planned = plan([instance], [r]);
    expect(planned).toHaveLength(14);
    expect(planned[0]).toEqual({ id: 't:i:2026-10-18T19:00', title: 'зарядка', date: TODAY, time: '19:00' });
    expect(planned[1]?.id).toBe('r:r:2026-10-19T19:00');
    expect(planned[13]?.id).toBe('r:r:2026-10-31T19:00');
  });

  it('сделанный экземпляр — сегодня ничего, дальше 13 дней', () => {
    const instance = task({ id: 'i', ruleId: 'r', time: '19:00', done: true });
    const planned = plan([instance], [rule({ id: 'r' })]);
    expect(planned).toHaveLength(13);
    expect(planned.every((r) => r.date > TODAY)).toBe(true);
  });

  it('без экземпляра сегодня правило напоминает и сегодня', () => {
    expect(plan([], [rule({ id: 'r' })])[0]?.id).toBe('r:r:2026-10-18T19:00');
  });

  it('каждый вт — только вторники за 14 дней', () => {
    const planned = plan([], [rule({ id: 'r', kind: 'weekly', weekdays: [2] })]);
    expect(planned.map((r) => r.date)).toEqual(['2026-10-20', '2026-10-27']);
  });

  it('неактивное правило и правило без времени — ничего', () => {
    expect(plan([], [rule({ id: 'off', active: false }), rule({ id: 'plain', time: undefined })])).toEqual([]);
  });

  it('startDate в будущем — с него', () => {
    const planned = plan([], [rule({ id: 'r', startDate: '2026-10-25' })]);
    expect(planned.map((r) => r.date)).toEqual([
      '2026-10-25',
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
    ]);
  });

  it('ближайшие первыми и не больше 100', () => {
    const rules = Array.from({ length: 10 }, (_, i) => rule({ id: `r${i}`, time: `1${i}:30` }));
    const planned = plan([task({ id: 'soon', time: '10:05' })], rules);
    expect(planned).toHaveLength(MAX_REMINDERS);
    expect(planned[0]?.id).toBe('t:soon:2026-10-18T10:05');
    expect(planned[1]?.id).toBe('r:r0:2026-10-18T10:30');
    const keys = planned.map((r) => `${r.date}T${r.time}`);
    expect(keys).toEqual([...keys].sort());
  });
});

describe('diffReminders', () => {
  const a: Reminder = { id: 't:a:2026-10-18T15:00', title: 'созвон', date: TODAY, time: '15:00' };
  const b: Reminder = { id: 't:b:2026-10-19T09:00', title: 'врач', date: '2026-10-19', time: '09:00' };

  it('всё совпадает — ничего не делаем', () => {
    expect(diffReminders([a, b], [{ id: a.id, title: a.title }, { id: b.id, title: b.title }])).toEqual({
      cancel: [],
      schedule: [],
    });
  });

  it('другой текст — отменить и поставить заново', () => {
    expect(diffReminders([a], [{ id: a.id, title: 'старое' }])).toEqual({ cancel: [a.id], schedule: [a] });
  });

  it('новое — поставить, лишнее — отменить', () => {
    expect(diffReminders([b], [{ id: a.id, title: a.title }])).toEqual({ cancel: [a.id], schedule: [b] });
  });
});
