import { Pressable, StyleSheet } from 'react-native';

import type { Composer } from '@/hooks/use-composer';
import { copy } from '@/lib/copy';

type Props = { composer: Composer };

/**
 * Пока идёт диктовка — прозрачный слой над шапкой и списком: тап куда угодно заканчивает её,
 * и сказанное записывается. Поле записи не накрыто: тап по нему — поправить услышанное руками.
 */
export function ListenCatcher({ composer: c }: Props) {
  if (!c.mic.listening) return null;
  return (
    <Pressable
      style={StyleSheet.absoluteFill}
      onPress={c.finishVoice}
      accessibilityRole="button"
      accessibilityLabel={copy.voice.stop}
    />
  );
}
