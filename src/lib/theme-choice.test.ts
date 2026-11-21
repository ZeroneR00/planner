import { isThemeChoice, resolveTheme } from '@/lib/theme-choice';

describe('resolveTheme', () => {
  it('«Как в телефоне» следует за телефоном', () => {
    expect(resolveTheme('system', 'dark')).toBe('night');
    expect(resolveTheme('system', 'light')).toBe('day');
  });

  it('тема телефона неизвестна — Ночь', () => {
    expect(resolveTheme('system', null)).toBe('night');
    expect(resolveTheme('system', undefined)).toBe('night');
  });

  it('выбранная тема не зависит от телефона', () => {
    expect(resolveTheme('night', 'light')).toBe('night');
    expect(resolveTheme('day', 'dark')).toBe('day');
  });
});

describe('isThemeChoice', () => {
  it('свои значения', () => {
    expect(isThemeChoice('system')).toBe(true);
    expect(isThemeChoice('night')).toBe(true);
    expect(isThemeChoice('day')).toBe(true);
  });

  it('чужие значения', () => {
    expect(isThemeChoice('voice')).toBe(false);
    expect(isThemeChoice('')).toBe(false);
  });
});
