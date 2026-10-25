import {
  nextOccurrence,
  nextRuleDate,
  occursOn,
  patternFor,
  repeatLabel,
  ruleOccursOn,
  samePattern,
} from '@/lib/rules';
import type { Rule } from '@/lib/types';

describe('occursOn', () => {
  it('weekdays — только пн–пт', () => {
    expect(occursOn({ kind: 'weekdays' }, '2026-10-19')).toBe(true);
    expect(occursOn({ kind: 'weekdays' }, '2026-10-17')).toBe(false);
    expect(occursOn({ kind: 'weekdays' }, '2026-10-18')).toBe(false);
  });

  it('weekly — в свой день недели', () => {
    expect(occursOn({ kind: 'weekly', weekdays: [2] }, '2026-10-20')).toBe(true);
    expect(occursOn({ kind: 'weekly', weekdays: [2] }, '2026-10-21')).toBe(false);
  });

  it('weekly по нескольким дням — в каждый из них', () => {
    expect(occursOn({ kind: 'weekly', weekdays: [3, 4] }, '2026-10-21')).toBe(true);
    expect(occursOn({ kind: 'weekly', weekdays: [3, 4] }, '2026-10-22')).toBe(true);
    expect(occursOn({ kind: 'weekly', weekdays: [3, 4] }, '2026-10-23')).toBe(false);
  });

  it.each([
    ['2027-02-28', true],
    ['2028-02-29', true],
    ['2028-02-28', false],
    ['2027-03-01', false],
  ])('yearly 29 февраля: %s → %s (в невисокосный год — 28-го)', (date, expected) => {
    expect(occursOn({ kind: 'yearly', month: 2, monthDay: 29 }, date)).toBe(expected);
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
    expect(nextOccurrence({ kind: 'weekly', weekdays: [6] }, '2026-10-17')).toBe('2026-10-17');
    expect(nextOccurrence({ kind: 'weekly', weekdays: [6] }, '2026-10-17', false)).toBe('2026-10-24');
  });

  it('weekdays с субботы — понедельник', () => {
    expect(nextOccurrence({ kind: 'weekdays' }, '2026-10-17')).toBe('2026-10-19');
  });

  it('monthly', () => {
    expect(nextOccurrence({ kind: 'monthly', monthDay: 31 }, '2026-11-05')).toBe('2026-11-30');
    expect(nextOccurrence({ kind: 'monthly', monthDay: 15 }, '2026-10-17')).toBe('2026-11-15');
  });

  it('weekly по нескольким дням — ближайший из них', () => {
    expect(nextOccurrence({ kind: 'weekly', weekdays: [3, 4] }, '2026-10-17')).toBe('2026-10-21');
    expect(nextOccurrence({ kind: 'weekly', weekdays: [3, 4] }, '2026-10-21', false)).toBe('2026-10-22');
  });

  it('yearly — через Новый год', () => {
    expect(nextOccurrence({ kind: 'yearly', month: 8, monthDay: 27 }, '2026-10-17')).toBe('2027-08-27');
    expect(nextOccurrence({ kind: 'yearly', month: 10, monthDay: 17 }, '2026-10-17', false)).toBe('2027-10-17');
  });
});

describe('nextRuleDate', () => {
  const tuesday: Rule = { id: 'r', title: 'мусор', kind: 'weekly', weekdays: [2], startDate: '2026-10-01', active: true };

  it('начало в прошлом — ближайший день с from', () => {
    expect(nextRuleDate(tuesday, '2026-10-25')).toBe('2026-10-27');
  });

  it('начало в будущем — не раньше начала', () => {
    expect(nextRuleDate({ ...tuesday, startDate: '2026-11-03' }, '2026-10-25')).toBe('2026-11-03');
    expect(nextRuleDate({ ...tuesday, startDate: '2026-11-01' }, '2026-10-25')).toBe('2026-11-03');
  });
});

describe('patternFor', () => {
  it('берёт день недели или число из выбранной даты', () => {
    expect(patternFor('weekly', '2026-10-20')).toEqual({ kind: 'weekly', weekdays: [2] });
    expect(patternFor('monthly', '2026-10-20')).toEqual({ kind: 'monthly', monthDay: 20 });
    expect(patternFor('daily', '2026-10-20')).toEqual({ kind: 'daily' });
    expect(patternFor('yearly', '2026-10-24')).toEqual({ kind: 'yearly', month: 10, monthDay: 24 });
  });
});

describe('repeatLabel', () => {
  it.each([
    [{ kind: 'daily' } as const, 'каждый день'],
    [{ kind: 'weekdays' } as const, 'по будням'],
    [{ kind: 'weekly', weekdays: [2] } as const, 'каждый вт'],
    [{ kind: 'weekly', weekdays: [3] } as const, 'каждую ср'],
    [{ kind: 'weekly', weekdays: [0] } as const, 'каждое вс'],
    [{ kind: 'weekly', weekdays: [3, 4] } as const, 'по ср и чт'],
    [{ kind: 'weekly', weekdays: [1, 3, 5] } as const, 'по пн, ср и пт'],
    [{ kind: 'weekly', weekdays: [0, 6] } as const, 'по сб и вс'],
    [{ kind: 'monthly', monthDay: 20 } as const, 'каждый месяц, 20-го'],
    [{ kind: 'yearly', month: 8, monthDay: 27 } as const, 'каждый год, 27 августа'],
  ])('%j → %s', (pattern, label) => {
    expect(repeatLabel(pattern)).toBe(label);
  });
});

describe('samePattern', () => {
  it('сравнивает вид и все поля', () => {
    expect(samePattern({ kind: 'weekly', weekdays: [3, 4] }, { kind: 'weekly', weekdays: [3, 4] })).toBe(true);
    expect(samePattern({ kind: 'weekly', weekdays: [3, 4] }, { kind: 'weekly', weekdays: [3] })).toBe(false);
    expect(samePattern({ kind: 'yearly', month: 8, monthDay: 27 }, { kind: 'monthly', monthDay: 27 })).toBe(false);
    expect(samePattern(null, null)).toBe(true);
    expect(samePattern(null, { kind: 'daily' })).toBe(false);
  });
});

describe('повтор каждые N дней', () => {
  const every2: Rule = { id: 'r', title: 'цветы', kind: 'interval', days: 2, startDate: '2026-10-17', active: true };

  it('ruleOccursOn — от начала через шаг', () => {
    expect(ruleOccursOn(every2, '2026-10-17')).toBe(true);
    expect(ruleOccursOn(every2, '2026-10-18')).toBe(false);
    expect(ruleOccursOn(every2, '2026-10-19')).toBe(true);
    expect(ruleOccursOn(every2, '2026-10-16')).toBe(false);
    expect(ruleOccursOn({ ...every2, active: false }, '2026-10-19')).toBe(false);
  });

  it('nextRuleDate', () => {
    expect(nextRuleDate(every2, '2026-10-18')).toBe('2026-10-19');
    expect(nextRuleDate(every2, '2026-10-10')).toBe('2026-10-17');
    expect(nextRuleDate({ ...every2, days: 3 }, '2026-10-18')).toBe('2026-10-20');
  });

  it.each([
    [2, 'через день'],
    [3, 'каждые 3 дня'],
    [5, 'каждые 5 дней'],
    [31, 'каждый 31 день'],
    [14, 'раз в 2 недели'],
    [35, 'раз в 5 недель'],
  ])('repeatLabel %i → %s', (days, label) => {
    expect(repeatLabel({ kind: 'interval', days })).toBe(label);
  });

  it('samePattern и patternFor', () => {
    expect(samePattern({ kind: 'interval', days: 2 }, { kind: 'interval', days: 2 })).toBe(true);
    expect(samePattern({ kind: 'interval', days: 2 }, { kind: 'interval', days: 3 })).toBe(false);
    expect(patternFor('interval', '2026-10-20')).toEqual({ kind: 'interval', days: 2 });
  });
});
