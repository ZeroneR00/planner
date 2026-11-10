import type { ReactNode } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

import { MicButton } from '@/components/mic-button';
import type { Composer } from '@/hooks/use-composer';
import { useKeyboardShown } from '@/hooks/use-keyboard-shown';
import { space } from '@/theme';

type Props = { composer: Composer; children?: ReactNode };

/**
 * Всё, что висит над списком у нижнего края: 🎙 справа и под ней плашка «Вернуть» (children).
 * Столбиком — плашка любой высоты поднимает кнопку, и они не налезают друг на друга.
 */
export function FloatingLayer({ composer: c, children }: Props) {
  const keyboardShown = useKeyboardShown();
  // Поле пустое и клавиатура спрятана: тап по полю, чтобы печатать, прячет кнопку без лишнего нажатия.
  // Пока слушает, слова уже в поле — кнопка остаётся. В Expo Go модуля голоса нет — и кнопки нет
  const showMic =
    c.mic.available && !c.editing && !c.camera && (c.mic.listening || (!c.typing && !keyboardShown));

  // Клавиатура при диктовке не нужна, а без фокуса тап по полю вызовет onFocus — и остановит запись
  const toggleVoice = () => {
    Keyboard.dismiss();
    c.toggleVoice();
  };

  return (
    // box-none: пустое место слоя не мешает листать и тапать список под ним
    <View style={styles.layer} pointerEvents="box-none">
      {showMic && (
        <View style={styles.mic} pointerEvents="box-none">
          <MicButton listening={c.mic.listening} level={c.mic.level} onPress={toggleVoice} />
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: space[12],
    right: space[12],
    bottom: space[8],
    gap: space[12],
  },
  // Правый край — как у строк списка. Снизу запас: волны и ореол на громком голосе не заходят на поле
  mic: {
    alignSelf: 'flex-end',
    marginRight: space[4],
    marginBottom: space[12],
  },
});
