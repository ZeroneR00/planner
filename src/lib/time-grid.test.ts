import { timeGrid, type TimeCell } from '@/lib/time-grid';

const TODAY = '2026-10-17';
const TOMORROW = '2026-10-18';

const cell = (cells: TimeCell[], key: string): TimeCell => {
  const found = cells.find((c) => c.key === key);
  if (found === undefined) throw new Error(`нет клетки ${key}`);
  return found;
};
const disabledKeys = (cells: TimeCell[]) => cells.filter((c) => c.disabled).map((c) => c.key);

describe('панель ⏰', () => {
  it('часы 0–23, минуты с шагом 5, утро/день/вечер', () => {
    const grid = timeGrid(null, TOMORROW, TODAY, '15:20');
    expect(grid.hours.map((c) => c.label)).toEqual(Array.from({ length: 24 }, (_, h) => String(h)));
    expect(grid.minutes.map((c) => c.label)).toEqual([
      ':00', ':05', ':10', ':15', ':20', ':25', ':30', ':35', ':40', ':45', ':50', ':55',
    ]);
    expect(grid.presets.map((c) => [c.label, c.time])).toEqual([
      ['Утром 9:00', '09:00'],
      ['Днём 13:00', '13:00'],
      ['Вечером 19:00', '19:00'],
    ]);
  });

  it('завтра — часы и пресеты активны; без времени минуты неактивны', () => {
    const grid = timeGrid(null, TOMORROW, TODAY, '23:50');
    expect(disabledKeys(grid.hours)).toEqual([]);
    expect(disabledKeys(grid.presets)).toEqual([]);
    expect(grid.minutes.every((c) => c.disabled)).toBe(true);
  });

  it('тап по часу без времени — ровно час', () => {
    expect(cell(timeGrid(null, TOMORROW, TODAY, '10:00').hours, 'h15').time).toBe('15:00');
  });

  it('смена часа сохраняет минуты', () => {
    const grid = timeGrid('15:30', TOMORROW, TODAY, '10:00');
    expect(cell(grid.hours, 'h16').time).toBe('16:30');
    expect(cell(grid.minutes, 'm45').time).toBe('15:45');
  });

  it('сегодня в 15:20: прошедшие часы и минуты неактивны', () => {
    const grid = timeGrid('15:30', TODAY, TODAY, '15:20');
    expect(disabledKeys(grid.hours)).toEqual(Array.from({ length: 15 }, (_, h) => `h${h}`));
    expect(disabledKeys(grid.minutes)).toEqual(['m0', 'm5', 'm10', 'm15', 'm20']);
    expect(disabledKeys(grid.presets)).toEqual(['morning', 'afternoon']);
  });

  it('текущий час, когда :00 прошло, — ближайшие будущие 5 минут', () => {
    expect(cell(timeGrid(null, TODAY, TODAY, '15:20').hours, 'h15').time).toBe('15:25');
    expect(cell(timeGrid('18:10', TODAY, TODAY, '15:20').hours, 'h15').time).toBe('15:25');
  });

  it('в 15:57 час 15 уже неактивен', () => {
    expect(cell(timeGrid(null, TODAY, TODAY, '15:57').hours, 'h15').disabled).toBe(true);
    expect(cell(timeGrid(null, TODAY, TODAY, '15:57').hours, 'h16').disabled).toBe(false);
  });

  it('выделено выбранное время', () => {
    const grid = timeGrid('09:00', TOMORROW, TODAY, '10:00');
    expect(grid.presets.filter((c) => c.selected).map((c) => c.key)).toEqual(['morning']);
    expect(grid.hours.filter((c) => c.selected).map((c) => c.key)).toEqual(['h9']);
    expect(grid.minutes.filter((c) => c.selected).map((c) => c.key)).toEqual(['m0']);
  });

  it('время не по сетке (15:37 из текста) — час выделен, минуты нет', () => {
    const grid = timeGrid('15:37', TOMORROW, TODAY, '10:00');
    expect(grid.hours.filter((c) => c.selected).map((c) => c.key)).toEqual(['h15']);
    expect(grid.minutes.some((c) => c.selected)).toBe(false);
    expect(cell(grid.hours, 'h16').time).toBe('16:37');
  });
});
