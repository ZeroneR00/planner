import { GolosText_400Regular } from '@expo-google-fonts/golos-text/400Regular';
import { GolosText_500Medium } from '@expo-google-fonts/golos-text/500Medium';
import { GolosText_600SemiBold } from '@expo-google-fonts/golos-text/600SemiBold';
import { GolosText_700Bold } from '@expo-google-fonts/golos-text/700Bold';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { DB_NAME, PlannerProvider, prepareDatabase } from '@/hooks/use-planner';
import { UndoProvider } from '@/hooks/use-undo';
import { colors, fonts } from '@/theme';

// Держим сплэш, пока не загрузятся шрифты, — иначе первый кадр нарисуется системным шрифтом и «прыгнет».
SplashScreen.preventAutoHideAsync();

// Фон контейнера навигации — тоже наш, чтобы на переходах между экранами не мелькало белое.
const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.line,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [fonts.regular]: GolosText_400Regular,
    [fonts.medium]: GolosText_500Medium,
    [fonts.semibold]: GolosText_600SemiBold,
    [fonts.bold]: GolosText_700Bold,
    [fonts.mono]: JetBrainsMono_500Medium,
  });

  // Если шрифт не загрузился, всё равно показываем приложение — на системном шрифте, а не пустой экран.
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      {/* Пока база не открыта и не мигрирована, SQLiteProvider ничего не рисует — это миллисекунды */}
      <SQLiteProvider databaseName={DB_NAME} onInit={prepareDatabase}>
        <PlannerProvider>
          <UndoProvider>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
          </UndoProvider>
        </PlannerProvider>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
