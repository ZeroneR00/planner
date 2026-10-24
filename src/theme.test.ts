import { colors, touch } from '@/theme';

describe('theme', () => {
  it('все цвета — #RRGGBB или #RRGGBBAA', () => {
    for (const value of Object.values(colors)) {
      expect(value).toMatch(/^#[0-9A-F]{6}([0-9A-F]{2})?$/);
    }
  });

  it('зона нажатия не меньше 44', () => {
    expect(touch).toBeGreaterThanOrEqual(44);
  });
});
