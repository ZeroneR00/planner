import { colors, touch } from '@/theme';

describe('theme', () => {
  it('все цвета — #RRGGBB', () => {
    for (const value of Object.values(colors)) {
      expect(value).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('зона нажатия не меньше 44', () => {
    expect(touch).toBeGreaterThanOrEqual(44);
  });
});
