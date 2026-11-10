import { isReminderAction, reminderActionChanges, snoozeMoment, type ReminderAction } from '@/lib/reminder-actions';
import type { Rule, Task } from '@/lib/types';

const TODAY = '2026-10-18';
const TOMORROW = '2026-10-19';
const BEFORE = '2026-10-01T06:00:00.000Z';
const NOW_ISO = '2026-10-18T07:00:00.000Z';

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
  return { kind: 'daily', title: overrides.id, startDate: '2026-10-01', active: true, time: '19:00', ...overrides } as Rule;
}

function act(id: string, action: ReminderAction, nowTime: string, tasks: Task[], rules: Rule[] = []) {
  return reminderActionChanges({ today: TODAY, tasks, rules }, id, action, nowTime, NOW_ISO);
}

describe('snoozeMoment: сейчас + N, вверх до 5 минут', () => {
  it.each([
    ['10:00', 15, TODAY, '10:15'],
    ['10:02', 15, TODAY, '10:20'],
    ['10:56', 60, TODAY, '12:00'],
    ['23:50', 15, TOMORROW, '00:05'],
    ['23:58', 60, TOMORROW, '01:00'],
  ])('%s + %i мин → %s %s', (time, minutes, date, expected) => {
    expect(snoozeMoment(TODAY, time, minutes)).toEqual({ date, time: expected });
  });
});

describe('isReminderAction', () => {
  it('наши кнопки — да, тап по самому уведомлению — нет', () => {
    expect(isReminderAction('snooze15')).toBe(true);
    expect(isReminderAction('done')).toBe(true);
    expect(isReminderAction('expo.modules.notifications.actions.DEFAULT')).toBe(false);
  });
});

describe('reminderActionChanges', () => {
  it('«Сделано» — галочка', () => {
    const a = task({ id: 'a', time: '10:00' });
    expect(act('t:a:2026-10-18T10:00', 'done', '10:01', [a])).toEqual({
      putTasks: [{ ...a, done: true, doneAt: NOW_ISO, updatedAt: NOW_ISO }],
    });
  });

  it('«+15 мин» — новое время и место перед более поздней задачей, ниже сдвигаются', () => {
    const a = task({ id: 'a', time: '10:00', order: 0 });
    const b = task({ id: 'b', time: '10:10', order: 1 });
    const c = task({ id: 'c', time: '10:30', order: 2 });
    expect(act('t:a:2026-10-18T10:00', 'snooze15', '10:00', [a, b, c])).toEqual({
      putTasks: [{ ...a, time: '10:15', order: 2, updatedAt: NOW_ISO }, { ...c, order: 3 }],
    });
  });

  it('за полночь — на завтра, без повтора и «вернулась»', () => {
    const a = task({ id: 'a', time: '23:50', ruleId: 'r1', returned: true, order: 3 });
    const { returned, ruleId, ...rest } = a;
    expect(act('t:a:2026-10-18T23:50', 'snooze15', '23:52', [a], [rule({ id: 'r1' })])).toEqual({
      putTasks: [{ ...rest, date: TOMORROW, time: '00:10', order: 0, updatedAt: NOW_ISO }],
    });
  });

  it('экземпляр повтора по r:-id — сдвигается, повтор остаётся', () => {
    const i = task({ id: 'i', ruleId: 'r1', time: '19:00' });
    expect(act('r:r1:2026-10-18T19:00', 'snooze60', '19:00', [i], [rule({ id: 'r1' })])).toEqual({
      putTasks: [{ ...i, time: '20:00', updatedAt: NOW_ISO }],
    });
  });

  it('устаревшее уведомление — ничего', () => {
    const id = 't:a:2026-10-18T10:00';
    expect(act(id, 'done', '10:01', [task({ id: 'b', time: '10:00' })])).toBeNull(); // задачи нет
    expect(act(id, 'done', '10:01', [task({ id: 'a', time: '10:00', done: true })])).toBeNull(); // уже сделана
    expect(act(id, 'snooze15', '10:01', [task({ id: 'a', time: '10:15' })])).toBeNull(); // время другое
    expect(act('t:a:2026-10-17T10:00', 'done', '10:01', [task({ id: 'a', date: null })])).toBeNull(); // в Стикерах
    expect(act('expo-1', 'done', '10:01', [task({ id: 'a', time: '10:00' })])).toBeNull(); // чужой id
    expect(act('r:r1:2026-10-18T19:00', 'done', '19:00', [], [rule({ id: 'r1' })])).toBeNull(); // нет экземпляра
  });

  it('второе нажатие после «+15 мин» — ничего', () => {
    const a = task({ id: 'a', time: '10:00' });
    const first = act('t:a:2026-10-18T10:00', 'snooze15', '10:00', [a]);
    const moved = [...(first?.putTasks ?? [])];
    expect(act('t:a:2026-10-18T10:00', 'snooze15', '10:00', moved)).toBeNull();
  });
});
