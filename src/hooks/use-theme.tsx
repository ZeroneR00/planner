// Тема: из настроек или из телефона («Как в телефоне»). Стили компонентов — по одному StyleSheet на тему.

import { DarkTheme, DefaultTheme, ThemeProvider, type Theme as NavigationTheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { createContext, use, useEffect, type ReactNode } from 'react';
import { Appearance, StyleSheet, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlanner } from '@/hooks/use-planner';
import { resolveTheme, THEME_NAMES, type ThemeName } from '@/lib/theme-choice';
import { themes, type Theme } from '@/theme';

// Кнопки навигации Android RN красит один раз при запуске — по теме телефона (enableEdgeToEdge),
// и сменить их потом нельзя: на HyperOS вызов из нативного кода не применяется.
// Читаем до первого Appearance.setColorScheme — пока это ещё тема телефона.
const navButtonsLight = Appearance.getColorScheme() === 'dark';

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
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Сплэш прячем, когда тема уже известна: иначе в Дне мелькнёт тёмный экран.
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={navigationTheme(theme)}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <ThemeContext value={theme}>{children}</ThemeContext>
      {/* Белые кнопки на светлой теме или тёмные на тёмной — подложка, чтобы их было видно */}
      {navButtonsLight !== theme.dark && (
        <View style={[styles.navBar, { height: insets.bottom, backgroundColor: theme.colors.navBar }]} />
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  // Поверх экранов, но не ловит нажатия; модальные окна (камера, фото) рисуются выше
  navBar: { position: 'absolute', left: 0, right: 0, bottom: 0, pointerEvents: 'none' },
});
