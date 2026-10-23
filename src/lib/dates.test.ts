import {
  addDays,
  at,
  capitalize,
  daysInMonth,
  diffDays,
  formatDayChip,
  formatDayLong,
  formatDayShort,
  formatHeaderDate,
  formatMonthTitle,
  makeDate,
  today,
  weekdayOf,
} from '@/lib/dates';

// Node подхватывает смену TZ на лету, а today() читает время только в момент вызова
process.env.TZ = 'Europe/Moscow';

describe('today', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('берёт локальную дату, а не UTC: 00:30 по Москве — уже новый день', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-17T21:30:00Z'));
    expect(today()).toBe('2026-10-18');
  });
});

describe('at', () => {
  it('возвращает элемент и бросает ошибку за границами', () => {
    expect(at(['a', 'b'], 1)).toBe('b');
    expect(() => at(['a'], 1)).toThrow(RangeError);
    expect(() => at(['a'], -1)).toThrow(RangeError);
  });
});

describe('арифметика дат', () => {
  it('addDays переходит через год, високосный февраль и назад', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('diffDays', () => {
    expect(diffDays('2026-10-17', '2026-10-31')).toBe(14);
    expect(diffDays('2026-10-31', '2026-10-17')).toBe(-14);
  });

  it('weekdayOf: 0 = воскресенье', () => {
    expect(weekdayOf('2026-10-17')).toBe(6);
    expect(weekdayOf('2026-10-18')).toBe(0);
  });

  it('daysInMonth', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 11)).toBe(30);
  });

  it('makeDate возвращает null для несуществующей даты', () => {
    expect(makeDate(2026, 11, 31)).toBeNull();
    expect(makeDate(2027, 2, 29)).toBeNull();
    expect(makeDate(2028, 2, 29)).toBe('2028-02-29');
  });
});

describe('подписи', () => {
  it('formatHeaderDate', () => {
    expect(formatHeaderDate('2026-10-17')).toBe('Суббота, 17 октября');
  });

  it('formatDayLong', () => {
    const t = '2026-10-17';
    expect(formatDayLong('2026-10-17', t)).toBe('сегодня, сб, 17 октября');
    expect(formatDayLong('2026-10-18', t)).toBe('завтра, вс, 18 октября');
    expect(formatDayLong('2026-10-20', t)).toBe('вт, 20 октября');
  });

  it('capitalize', () => {
    expect(capitalize('завтра, вс, 18 октября')).toBe('Завтра, вс, 18 октября');
    expect(capitalize('')).toBe('');
  });

  it('formatDayChip / formatDayShort / formatMonthTitle', () => {
    expect(formatDayChip('2026-10-19')).toBe('Пн 19');
    expect(formatDayShort('2026-10-27')).toBe('27 окт');
    expect(formatMonthTitle('2026-10-17')).toBe('Октябрь 2026');
  });
});
