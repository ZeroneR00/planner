import { GolosText_400Regular } from '@expo-google-fonts/golos-text/400Regular';
import { GolosText_500Medium } from '@expo-google-fonts/golos-text/500Medium';
import { GolosText_600SemiBold } from '@expo-google-fonts/golos-text/600SemiBold';
import { GolosText_700Bold } from '@expo-google-fonts/golos-text/700Bold';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium';
import { Unbounded_600SemiBold } from '@expo-google-fonts/unbounded/600SemiBold';
import { Unbounded_700Bold } from '@expo-google-fonts/unbounded/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';

import { JarvisVoiceProvider } from '@/hooks/use-jarvis-voice';
import { PlannerProvider, prepareDatabase } from '@/hooks/use-planner';
import { RevealProvider } from '@/hooks/use-reveal';
import { AppThemeProvider, useTheme } from '@/hooks/use-theme';
import { UndoProvider } from '@/hooks/use-undo';
import { DB_NAME } from '@/lib/db';
import { fonts } from '@/theme';

// Держим сплэш, пока не загрузятся шрифты и не станет известна тема, — иначе первый кадр «прыгнет».
SplashScreen.preventAutoHideAsync();

function Screens() {
  const { colors } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [fonts.regular]: GolosText_400Regular,
    [fonts.medium]: GolosText_500Medium,
    [fonts.semibold]: GolosText_600SemiBold,
    [fonts.bold]: GolosText_700Bold,
    [fonts.mono]: JetBrainsMono_500Medium,
    [fonts.display]: Unbounded_600SemiBold,
    [fonts.displayBold]: Unbounded_700Bold,
  });

  // Если шрифт не загрузился, всё равно показываем приложение — на системном шрифте, а не пустой экран.
  const ready = fontsLoaded || fontError !== null;

  if (!ready) {
    return null;
  }

  return (
    // Пока база не открыта и не мигрирована, SQLiteProvider ничего не рисует — это миллисекунды
    <SQLiteProvider databaseName={DB_NAME} onInit={prepareDatabase}>
      <PlannerProvider>
        {/* Внутри PlannerProvider: тема — в настройках; сплэш прячет он */}
        <AppThemeProvider>
          {/* Какой голос выбран — тоже в настройках */}
          <JarvisVoiceProvider>
            <UndoProvider>
              {/* Внутри базы: тап по напоминанию ищет задачу в данных и ведёт к ней */}
              <RevealProvider>
                <Screens />
              </RevealProvider>
            </UndoProvider>
          </JarvisVoiceProvider>
        </AppThemeProvider>
      </PlannerProvider>
    </SQLiteProvider>
  );
}
