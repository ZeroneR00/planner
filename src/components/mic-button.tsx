import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { copy } from '@/lib/copy';
import { colors, pressedOpacity, radius, size } from '@/theme';

type Props = { listening: boolean; level: SharedValue<number>; onPress: () => void };

// Насколько ореол вырастает на самом громком звуке; громкость приходит раз в 100 мс — сглаживаем
const PULSE = 0.35;
const PULSE_MS = 100;

/** Кнопка диктовки: зелёная — тап, чтобы говорить; красная с ореолом в такт голосу — слушаю. */
export function MicButton({ listening, level, onPress }: Props) {
  const reducedMotion = useReducedMotion();
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reducedMotion ? 1 : 1 + PULSE * withTiming(level.get(), { duration: PULSE_MS }) }],
  }));

  return (
    <View>
      {listening && <Animated.View style={[styles.ring, ringStyle]} />}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={listening ? copy.voice.stop : copy.voice.start}
        accessibilityState={{ busy: listening }}
        style={({ pressed }) => [styles.button, listening && styles.listening, pressed && styles.pressed]}
      >
        <Icon name="mic" size={22} color={colors.onAccent} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.field,
    backgroundColor: colors.listeningRing,
  },
  button: {
    width: size.field,
    height: size.field,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.field,
    backgroundColor: colors.accent,
  },
  listening: {
    backgroundColor: colors.danger,
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
