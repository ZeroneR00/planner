import { THEME_NAMES } from '@/lib/theme-choice';
import { palettes, themes, touch, type Palette } from '@/theme';

// Относительная яркость sRGB и контраст по WCAG 2.x
function channel(hex: string, at: number): number {
  const v = parseInt(hex.slice(at, at + 2), 16) / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
}

function contrast(a: string, b: string): number {
  const hi = Math.max(luminance(a), luminance(b));
  const lo = Math.min(luminance(a), luminance(b));
  return (hi + 0.05) / (lo + 0.05);
}

// Пары «текст на фоне», которые должны читаться
const PAIRS: [keyof Palette, keyof Palette][] = [
  ['text', 'bg'],
  ['text', 'surface'],
  ['text', 'row'],
  ['textSecondary', 'bg'],
  ['textSecondary', 'row'],
  ['textSecondary', 'surface'],
  ['textHint', 'field'],
  ['accent', 'row'],
  ['onAccent', 'accent'],
  ['warning', 'row'],
  ['nowText', 'now'],
  ['nowOnDone', 'nowDone'],
];

describe('theme', () => {
  it('все цвета — #RRGGBB или #RRGGBBAA', () => {
    for (const palette of Object.values(palettes)) {
      for (const value of Object.values(palette)) {
        expect(value).toMatch(/^#[0-9A-F]{6}([0-9A-F]{2})?$/);
      }
    }
  });

  it('темы названы своими именами', () => {
    for (const name of THEME_NAMES) expect(themes[name].name).toBe(name);
    expect(themes.night.dark).toBe(true);
    expect(themes.day.dark).toBe(false);
  });

  it.each(THEME_NAMES)('контраст текста не меньше 4,5 — %s', (name) => {
    const palette = palettes[name];
    for (const [fg, bg] of PAIRS) {
      expect({ pair: `${fg}/${bg}`, ok: contrast(palette[fg], palette[bg]) >= 4.5 }).toEqual({
        pair: `${fg}/${bg}`,
        ok: true,
      });
    }
  });

  it('зона нажатия не меньше 44', () => {
    expect(touch).toBeGreaterThanOrEqual(44);
  });
});
