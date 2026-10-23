import { nextOccurrence, occursOn, patternFor, repeatLabel, ruleOccursOn } from '@/lib/rules';
import type { Rule } from '@/lib/types';

describe('occursOn', () => {
  it('weekdays — только пн–пт', () => {
    expect(occursOn({ kind: 'weekdays' }, '2026-10-19')).toBe(true);
    expect(occursOn({ kind: 'weekdays' }, '2026-10-17')).toBe(false);
    expect(occursOn({ kind: 'weekdays' }, '2026-10-18')).toBe(false);
  });

  it('weekly — в свой день недели', () => {
    expect(occursOn({ kind: 'weekly', weekday: 2 }, '2026-10-20')).toBe(true);
    expect(occursOn({ kind: 'weekly', weekday: 2 }, '2026-10-21')).toBe(false);
  });

  it.each([
    ['2026-11-30', true],
    ['2026-11-29', false],
    ['2026-10-31', true],
    ['2026-10-30', false],
    ['2026-02-28', true],
    ['2028-02-29', true],
    ['2028-02-28', false],
  ])('monthly 31-го: %s → %s (нет числа — последний день месяца)', (date, expected) => {
    expect(occursOn({ kind: 'monthly', monthDay: 31 }, date)).toBe(expected);
  });

  it('monthly 30-го в феврале — 28-го', () => {
    expect(occursOn({ kind: 'monthly', monthDay: 30 }, '2026-02-28')).toBe(true);
  });
});

describe('ruleOccursOn', () => {
  const rule: Rule = { id: 'r1', title: 'зарядка', kind: 'daily', startDate: '2026-10-17', active: true };

  it('неактивное правило не срабатывает', () => {
    expect(ruleOccursOn({ ...rule, active: false }, '2026-10-18')).toBe(false);
  });

  it('не срабатывает до startDate, срабатывает в сам startDate', () => {
    expect(ruleOccursOn(rule, '2026-10-16')).toBe(false);
    expect(ruleOccursOn(rule, '2026-10-17')).toBe(true);
  });
});

describe('nextOccurrence', () => {
  it('inclusive берёт сам день, exclusive — следующий', () => {
    expect(nextOccurrence({ kind: 'weekly', weekday: 6 }, '2026-10-17')).toBe('2026-10-17');
    expect(nextOccurrence({ kind: 'weekly', weekday: 6 }, '2026-10-17', false)).toBe('2026-10-24');
  });

  it('weekdays с субботы — понедельник', () => {
    expect(nextOccurrence({ kind: 'weekdays' }, '2026-10-17')).toBe('2026-10-19');
  });

  it('monthly', () => {
    expect(nextOccurrence({ kind: 'monthly', monthDay: 31 }, '2026-11-05')).toBe('2026-11-30');
    expect(nextOccurrence({ kind: 'monthly', monthDay: 15 }, '2026-10-17')).toBe('2026-11-15');
  });
});

describe('patternFor', () => {
  it('берёт день недели или число из выбранной даты', () => {
    expect(patternFor('weekly', '2026-10-20')).toEqual({ kind: 'weekly', weekday: 2 });
    expect(patternFor('monthly', '2026-10-20')).toEqual({ kind: 'monthly', monthDay: 20 });
    expect(patternFor('daily', '2026-10-20')).toEqual({ kind: 'daily' });
  });
});

describe('repeatLabel', () => {
  it.each([
    [{ kind: 'daily' } as const, 'каждый день'],
    [{ kind: 'weekdays' } as const, 'по будням'],
    [{ kind: 'weekly', weekday: 2 } as const, 'каждый вт'],
    [{ kind: 'weekly', weekday: 3 } as const, 'каждую ср'],
    [{ kind: 'weekly', weekday: 0 } as const, 'каждое вс'],
    [{ kind: 'monthly', monthDay: 20 } as const, 'каждый месяц, 20-го'],
  ])('%j → %s', (pattern, label) => {
    expect(repeatLabel(pattern)).toBe(label);
  });
});
