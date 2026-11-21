// Тема: из настроек или из телефона («Как в телефоне»). Стили компонентов — по одному StyleSheet на тему.

import { DarkTheme, DefaultTheme, ThemeProvider, type Theme as NavigationTheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { createContext, use, useEffect, type ReactNode } from 'react';
import { Appearance, StyleSheet, useColorScheme } from 'react-native';

import { usePlanner } from '@/hooks/use-planner';
import { resolveTheme, THEME_NAMES, type ThemeName } from '@/lib/theme-choice';
import { themes, type Theme } from '@/theme';

const ThemeContext = createContext<Theme>(themes.night);

export function useTheme(): Theme {
  return use(ThemeContext);
}

/** Стили под тему: по одному StyleSheet на каждую тему — создаются сразу, без кэша в рендере. */
// Сигнатура как у StyleSheet.create: пересечение S & Styles даёт контекстный тип,
// и 'row' / 'center' остаются литералами, а не расширяются до string.
type Styles = Parameters<typeof StyleSheet.create>[0];

export function themedStyles<S extends Styles>(make: (t: Theme) => S & Styles): () => Readonly<S> {
  const byTheme = Object.fromEntries(
    THEME_NAMES.map((name) => [name, StyleSheet.create<S>(make(themes[name]))]),
  ) as Record<ThemeName, Readonly<S>>;
  return function useStyles() {
    return byTheme[useTheme().name];
  };
}

function navigationTheme(theme: Theme): NavigationTheme {
  const base = theme.dark ? DarkTheme : DefaultTheme;
  const { colors } = theme;
  // Фон контейнера навигации — тоже наш, чтобы на переходах между экранами не мелькал чужой цвет.
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.bg,
      card: colors.bg,
      text: colors.text,
      border: colors.line,
    },
  };
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = usePlanner();
  const scheme = useColorScheme();
  const theme = themes[resolveTheme(settings.theme, scheme)];

  useEffect(() => {
    // Системные мелочи окна (меню копирования, панель навигации) — в цвет темы.
    // При «Как в телефоне» не навязываем схему, иначе useColorScheme перестанет следовать за телефоном.
    Appearance.setColorScheme(
      settings.theme === 'system' ? 'unspecified' : theme.dark ? 'dark' : 'light',
    );
    // Фон под клавиатурой и переходами
    SystemUI.setBackgroundColorAsync(theme.colors.bg);
  }, [settings.theme, theme]);

  useEffect(() => {
    // Сплэш прячем, когда тема уже известна: иначе в Дне мелькнёт тёмный экран.
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={navigationTheme(theme)}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <ThemeContext value={theme}>{children}</ThemeContext>
    </ThemeProvider>
  );
}
