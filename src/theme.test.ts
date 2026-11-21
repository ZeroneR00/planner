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

const HEX = /^#[0-9A-F]{6}([0-9A-F]{2})?$/;

// Прозрачный фон (…00) — под ним фон экрана
function under(palette: Palette, key: keyof Palette): string {
  const value = palette[key];
  return value.endsWith('00') && value.length === 9 ? palette.bg : value;
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
  ['mark', 'accent'],
  ['aheadText', 'ahead'],
  ['aheadCount', 'ahead'],
];

describe('theme', () => {
  it('все цвета — #RRGGBB или #RRGGBBAA', () => {
    for (const palette of Object.values(palettes)) {
      for (const value of Object.values(palette)) {
        expect(value).toMatch(HEX);
      }
    }
    for (const { details } of Object.values(themes)) {
      if (details.glow !== null) expect(details.glow).toMatch(HEX);
      if (details.sticker !== null) expect(details.sticker.tape).toMatch(HEX);
      for (const note of details.notes ?? []) expect(note.color).toMatch(HEX);
    }
  });

  it('темы названы своими именами', () => {
    for (const name of THEME_NAMES) expect(themes[name].name).toBe(name);
    expect(themes.night.dark).toBe(true);
    expect(themes.day.dark).toBe(false);
    expect(themes.voice.dark).toBe(true);
    expect(themes.stickers.dark).toBe(false);
  });

  it.each(THEME_NAMES)('контраст текста не меньше 4,5 — %s', (name) => {
    const palette = palettes[name];
    for (const [fg, bg] of PAIRS) {
      expect({
        pair: `${fg}/${bg}`,
        ok: contrast(palette[fg], under(palette, bg)) >= 4.5,
      }).toEqual({
        pair: `${fg}/${bg}`,
        ok: true,
      });
    }
  });

  it('текст и «↩ не сделано» читаются на бумажках «Стикеров»', () => {
    const { colors, details } = themes.stickers;
    expect(details.notes).not.toBeNull();
    for (const note of details.notes ?? []) {
      expect(contrast(colors.text, note.color)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors.warning, note.color)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('у каждой темы с бумажками есть цвета бумажек', () => {
    for (const { details } of Object.values(themes)) {
      expect(details.pocket === 'notes').toBe(details.notes !== null && details.notes.length > 0);
    }
  });

  // Кружок с числом «Впереди» есть только у тем с countBadge
  it.each(THEME_NAMES.filter((name) => themes[name].details.countBadge))(
    'число в кружке «Впереди» читается — %s',
    (name) => {
      const { colors } = themes[name];
      expect(contrast(colors.onAheadCount, colors.aheadCount)).toBeGreaterThanOrEqual(4.5);
    },
  );

  // Полоса нужна, когда кнопки навигации не совпали с темой: в тёмной теме они тёмные, в светлой — белые
  it.each(THEME_NAMES)('кнопки навигации видны на полосе — %s', (name) => {
    const { dark, colors } = themes[name];
    expect(contrast(dark ? '#000000' : '#FFFFFF', colors.navBar)).toBeGreaterThanOrEqual(4.5);
  });

  it('зона нажатия не меньше 44', () => {
    expect(touch).toBeGreaterThanOrEqual(44);
  });
});
