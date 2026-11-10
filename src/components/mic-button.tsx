import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { copy } from '@/lib/copy';
import { colors, pressedOpacity, radius, size } from '@/theme';

type Props = { listening: boolean; level: SharedValue<number>; onPress: () => void };

// Пока слушает: ореол вырастает на самом громком звуке на столько, кнопка — на столько.
// Громкость приходит раз в 100 мс — сглаживаем
const RING_PULSE = 0.55;
const BODY_PULSE = 0.08;
const PULSE_MS = 100;
// Тап — кнопка за столько вырастает до size.voiceListening
const GROW_MS = 220;
// Волны, пока ждёт: две по очереди, каждая расходится за WAVE_MS и тает
const WAVE_MS = 2400;
const WAVE_SCALE = 0.7;
const WAVE_OPACITY = 0.4;

/**
 * Кнопка диктовки «в воздухе». Ждёт — зелёная, от неё расходятся волны: говори.
 * Слушает — вырастает, краснеет, сама кнопка и ореол пульсируют в такт голосу.
 */
export function MicButton({ listening, level, onPress }: Props) {
  const reducedMotion = useReducedMotion();
  const wave = useSharedValue(0); // 0…1 по кругу
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
    if (reducedMotion || listening) {
      cancelAnimation(wave);
      wave.set(0);
      return;
    }
    wave.set(0);
    wave.set(withRepeat(withTiming(1, { duration: WAVE_MS, easing: Easing.out(Easing.quad) }), -1));
    return () => cancelAnimation(wave);
  }, [wave, reducedMotion, listening]);

  useEffect(() => {
    grow.set(withTiming(listening ? 1 : 0, { duration: reducedMotion ? 0 : GROW_MS }));
  }, [grow, listening, reducedMotion]);

  // Размер, а не scale: кнопка стоит в углу и растёт вверх-влево, не наезжая на поле
  const sizeStyle = useAnimatedStyle(() => {
    const d = size.voice + (size.voiceListening - size.voice) * grow.get();
    return { width: d, height: d };
  });
  const firstWave = useAnimatedStyle(() => waveFrame(wave.get()));
  // Вторая волна — на полкруга позже: пока первая тает, вторая уже идёт
  const secondWave = useAnimatedStyle(() => waveFrame((wave.get() + 0.5) % 1));
  // withTiming — снаружи: это анимация, а не число, и «1 + k * withTiming(…)» даёт NaN — кнопка пропадает
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reducedMotion ? 1 : withTiming(1 + RING_PULSE * level.get(), { duration: PULSE_MS }) }],
  }));
  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: !listening || reducedMotion ? 1 : withTiming(1 + BODY_PULSE * level.get(), { duration: PULSE_MS }) },
    ],
  }));

  const waiting = !listening && !reducedMotion;
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={sizeStyle}>
      {waiting && <Animated.View style={[styles.wave, firstWave]} />}
      {waiting && <Animated.View style={[styles.wave, secondWave]} />}
      {listening && <Animated.View style={[styles.ring, ringStyle]} />}
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

function waveFrame(p: number) {
  'worklet';
  return { opacity: WAVE_OPACITY * (1 - p), transform: [{ scale: 1 + WAVE_SCALE * p }] };
}

const styles = StyleSheet.create({
  wave: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  ring: {
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
});
