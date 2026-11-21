import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { themedStyles, useTheme } from '@/hooks/use-theme';
import { copy } from '@/lib/copy';
import { pressedOpacity, radius, size, space } from '@/theme';

type Props = { listening: boolean; level: SharedValue<number>; onPress: () => void };

// Пока слушает: ореол вырастает на самом громком звуке на столько, кнопка — на столько.
// Громкость приходит раз в 100 мс — сглаживаем
const RING_PULSE = 0.55;
const BODY_PULSE = 0.08;
const PULSE_MS = 100;
// Тап — кнопка за столько вырастает до size.voiceListening
const GROW_MS = 220;

/**
 * Кнопка диктовки «в воздухе». Ждёт — цвета акцента, вокруг тонкое кольцо.
 * Слушает — вырастает, краснеет, сама кнопка и ореол пульсируют в такт голосу.
 */
export function MicButton({ listening, level, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const reducedMotion = useReducedMotion();
  const grow = useSharedValue(listening ? 1 : 0); // 0 — ждёт, 1 — слушает
  // Запись — с касания, держать не надо. Читалка экрана касания не шлёт, только «нажатие» —
  // поэтому onPress срабатывает, только если касания не было, иначе отпускание пальца остановило бы запись
  const touched = useRef(false);
  const pressIn = () => {
    touched.current = true;
    onPress();
  };
  const press = () => {
    if (touched.current) touched.current = false;
    else onPress();
  };

  useEffect(() => {
    grow.set(withTiming(listening ? 1 : 0, { duration: reducedMotion ? 0 : GROW_MS }));
  }, [grow, listening, reducedMotion]);

  // Размер, а не scale: кнопка стоит в углу и растёт вверх-влево, не наезжая на поле
  const sizeStyle = useAnimatedStyle(() => {
    const d = size.voice + (size.voiceListening - size.voice) * grow.get();
    return { width: d, height: d };
  });
  // withTiming — снаружи: это анимация, а не число, и «1 + k * withTiming(…)» даёт NaN — кнопка пропадает
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reducedMotion ? 1 : withTiming(1 + RING_PULSE * level.get(), { duration: PULSE_MS }) }],
  }));
  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: !listening || reducedMotion ? 1 : withTiming(1 + BODY_PULSE * level.get(), { duration: PULSE_MS }) },
    ],
  }));

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={sizeStyle}>
      {listening ? (
        <Animated.View style={[styles.pulse, pulseStyle]} />
      ) : (
        <Animated.View pointerEvents="none" style={styles.ring} />
      )}
      <Animated.View style={[StyleSheet.absoluteFill, bodyStyle]}>
        <Pressable
          onPressIn={pressIn}
          onPress={press}
          accessibilityRole="button"
          accessibilityLabel={listening ? copy.voice.stop : copy.voice.start}
          accessibilityState={{ busy: listening }}
          style={({ pressed }) => [styles.button, listening && styles.listening, pressed && styles.pressed]}
        >
          <Icon name="mic" size={listening ? 30 : 24} color={colors.onAccent} strokeWidth={2.2} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const useStyles = themedStyles(({ colors }) => ({
  // Пока ждёт — неподвижное тонкое кольцо
  ring: {
    position: 'absolute',
    top: -space[14],
    left: -space[14],
    right: -space[14],
    bottom: -space[14],
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.micRing,
  },
  pulse: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.pill,
    backgroundColor: colors.listeningRing,
  },
  // Тень — будто кнопка висит над экраном
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    elevation: 8,
    shadowColor: colors.shadow,
  },
  listening: {
    backgroundColor: colors.danger,
  },
  pressed: {
    opacity: pressedOpacity,
  },
}));
