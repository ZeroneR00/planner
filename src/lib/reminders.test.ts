import {
  MAX_REMINDERS,
  REMINDER_CATEGORY,
  diffReminders,
  parseReminderId,
  planReminders,
  reminderTarget,
  staleShown,
  type Reminder,
} from '@/lib/reminders';
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
  const category = REMINDER_CATEGORY;

  it('всё совпадает — ничего не делаем', () => {
    expect(
      diffReminders(
        [a, b],
        [
          { id: a.id, title: a.title, category },
          { id: b.id, title: b.title, category },
        ],
      ),
    ).toEqual({ cancel: [], schedule: [] });
  });

  it('другой текст — отменить и поставить заново', () => {
    expect(diffReminders([a], [{ id: a.id, title: 'старое', category }])).toEqual({ cancel: [a.id], schedule: [a] });
  });

  it('новое — поставить, лишнее — отменить', () => {
    expect(diffReminders([b], [{ id: a.id, title: a.title, category }])).toEqual({ cancel: [a.id], schedule: [b] });
  });

  it('поставлено без кнопок — переставить', () => {
    expect(diffReminders([a], [{ id: a.id, title: a.title, category: null }])).toEqual({
      cancel: [a.id],
      schedule: [a],
    });
  });
});

describe('parseReminderId', () => {
  it('время с «:» не мешает', () => {
    expect(parseReminderId('t:a:2026-10-18T15:00')).toEqual({ kind: 't', id: 'a', date: TODAY, time: '15:00' });
    expect(parseReminderId('r:r1:2026-10-19T09:30')).toEqual({ kind: 'r', id: 'r1', date: '2026-10-19', time: '09:30' });
  });

  it('чужой id — null', () => {
    expect(parseReminderId('expo-123')).toBeNull();
    expect(parseReminderId('t:a')).toBeNull();
    expect(parseReminderId('t:a:2026-10-18T15:00:00')).toBeNull();
  });
});

describe('staleShown: что убрать из шторки', () => {
  const stale = (ids: string[], tasks: Task[], rules: Rule[] = []) => staleShown(ids, { tasks, rules });

  it('задача как была — остаётся', () => {
    expect(stale(['t:a:2026-10-18T15:00'], [task({ id: 'a', time: '15:00' })])).toEqual([]);
  });

  it('сделана, удалена, время другое, перенесена на другой день — убрать', () => {
    expect(stale(['t:a:2026-10-18T15:00'], [task({ id: 'a', time: '15:00', done: true })])).toHaveLength(1);
    expect(stale(['t:a:2026-10-18T15:00'], [])).toHaveLength(1);
    expect(stale(['t:a:2026-10-18T15:00'], [task({ id: 'a', time: '15:15' })])).toHaveLength(1);
    expect(stale(['t:a:2026-10-18T15:00'], [task({ id: 'a', date: '2026-10-19', time: '15:00' })])).toHaveLength(1);
    expect(stale(['t:a:2026-10-17T15:00'], [task({ id: 'a', date: null })])).toHaveLength(1); // ушла в Стикеры
  });

  it('повтор без экземпляра: правило напоминает — остаётся, остановлено или время другое — убрать', () => {
    const id = 'r:r1:2026-10-18T19:00';
    expect(stale([id], [], [rule({ id: 'r1' })])).toEqual([]);
    expect(stale([id], [], [rule({ id: 'r1', active: false })])).toEqual([id]);
    expect(stale([id], [], [rule({ id: 'r1', time: '20:00' })])).toEqual([id]);
  });

  it('экземпляр повтора сделан — убрать', () => {
    const id = 'r:r1:2026-10-18T19:00';
    expect(stale([id], [task({ id: 'i', ruleId: 'r1', time: '19:00', done: true })], [rule({ id: 'r1' })])).toEqual([
      id,
    ]);
  });

  it('чужой id — не трогаем', () => {
    expect(stale(['expo-123'], [])).toEqual([]);
  });
});

describe('reminderTarget: куда ведёт тап по уведомлению', () => {
  const target = (id: string, tasks: Task[], rules: Rule[] = []) =>
    reminderTarget(id, { tasks, rules, today: TODAY });

  it('задача сегодня — «Сегодня», сделанная тоже', () => {
    expect(target('t:a:2026-10-18T15:00', [task({ id: 'a', time: '15:00' })])).toEqual({ screen: 'today', id: 'a' });
    expect(target('t:a:2026-10-18T15:00', [task({ id: 'a', done: true })])).toEqual({ screen: 'today', id: 'a' });
  });

  it('уехала в стикеры — «Сегодня», а сделанный стикер нигде не виден', () => {
    expect(target('t:a:2026-10-17T15:00', [task({ id: 'a', date: null })])).toEqual({ screen: 'today', id: 'a' });
    expect(target('t:a:2026-10-17T15:00', [task({ id: 'a', date: null, done: true })])).toBeNull();
  });

  it('перенесли на завтра — «Впереди», сделанная будущая не видна', () => {
    expect(target('t:a:2026-10-18T15:00', [task({ id: 'a', date: '2026-10-19' })])).toEqual({
      screen: 'ahead',
      id: 'a',
    });
    expect(target('t:a:2026-10-18T15:00', [task({ id: 'a', date: '2026-10-19', done: true })])).toBeNull();
  });

  it('удалённая и вчерашняя — некуда вести', () => {
    expect(target('t:a:2026-10-18T15:00', [task({ id: 'b' })])).toBeNull();
    expect(target('t:a:2026-10-17T15:00', [task({ id: 'a', date: '2026-10-17', done: true })])).toBeNull();
  });

  it('повтор с экземпляром на эту дату — сам экземпляр', () => {
    const tasks = [task({ id: 'old', ruleId: 'r1', date: '2026-10-17', done: true }), task({ id: 'x', ruleId: 'r1' })];
    expect(target('r:r1:2026-10-18T19:00', tasks, [rule({ id: 'r1' })])).toEqual({ screen: 'today', id: 'x' });
  });

  it('повтор без экземпляра — правило во «Впереди», остановленное — некуда', () => {
    expect(target('r:r1:2026-10-18T19:00', [], [rule({ id: 'r1' })])).toEqual({ screen: 'ahead', id: 'r1' });
    expect(target('r:r1:2026-10-18T19:00', [], [rule({ id: 'r1', active: false })])).toBeNull();
  });

  it('чужой id — некуда', () => {
    expect(target('expo-123', [task({ id: 'a' })])).toBeNull();
    expect(target('t:a', [task({ id: 'a' })])).toBeNull();
  });
});
