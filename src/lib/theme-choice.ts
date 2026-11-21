// Выбор оформления: тема или «Как в телефоне»

/** Порядок картинок тем в «Настройках». */
export const THEME_NAMES = ['night', 'day', 'voice', 'stickers'] as const;

export type ThemeName = (typeof THEME_NAMES)[number];

/** 'system' — «Как в телефоне»: тема следует за тёмной / светлой темой телефона. */
export type ThemeChoice = 'system' | ThemeName;

export function isThemeChoice(value: string): value is ThemeChoice {
  return value === 'system' || (THEME_NAMES as readonly string[]).includes(value);
}

/** «Как в телефоне»: светлая тема телефона → День, тёмная или неизвестная → Ночь. */
export function resolveTheme(
  choice: ThemeChoice,
  scheme: 'light' | 'dark' | null | undefined,
): ThemeName {
  if (choice !== 'system') return choice;
  return scheme === 'light' ? 'day' : 'night';
}
