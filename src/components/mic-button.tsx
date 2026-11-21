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
import { themedStyles, useTheme } from '@/hooks/use-theme';
import { copy } from '@/lib/copy';
import { circle, pressedOpacity, size, space } from '@/theme';

type Props = {
  listening: boolean;
  level: SharedValue<number>;
  onPress: () => void;
  big?: boolean; // «Голос»: большая по центру нижней панели, а не «в воздухе»
};

// Пока слушает: ореол вырастает на самом громком звуке на столько, кнопка — на столько.
// Громкость приходит раз в 100 мс — сглаживаем
const RING_PULSE = 0.55;
const BODY_PULSE = 0.08;
const PULSE_MS = 100;
// Тап — кнопка за столько вырастает до size.voiceListening (большая — до voiceBigListening)
const GROW_MS = 220;
// «Голос», пока ждёт: три кольца по очереди расходятся за WAVE_MS до 2,4 кнопки и тают
const WAVE_MS = 3000;
const WAVE_SCALE = 1.4;
const WAVE_OPACITY = 0.45;
// phase — на какую долю круга кольцо отстаёт; still — где оно стоит при «уменьшить движение», как на холсте
const WAVES = [
  { phase: 0, still: { scale: 1.4, opacity: 0.45 } },
  { phase: 1 / 3, still: { scale: 1.87, opacity: 0.22 } },
  { phase: 2 / 3, still: { scale: 2.4, opacity: 0.09 } },
] as const;

/**
 * Кнопка диктовки «в воздухе». Ждёт — цвета акцента, вокруг тонкое кольцо (в «Голосе» — расходятся три).
 * Слушает — вырастает, краснеет, сама кнопка и ореол пульсируют в такт голосу.
 */
export function MicButton({ listening, level, onPress, big = false }: Props) {
  const { colors, details } = useTheme();
  const styles = useStyles();
  const reducedMotion = useReducedMotion();
  const grow = useSharedValue(listening ? 1 : 0); // 0 — ждёт, 1 — слушает
  const wave = useSharedValue(0); // 0…1 по кругу
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

  useEffect(() => {
    if (!details.waves || listening || reducedMotion) {
      cancelAnimation(wave);
      wave.set(0);
      return;
    }
    wave.set(0);
    wave.set(withRepeat(withTiming(1, { duration: WAVE_MS, easing: Easing.linear }), -1));
    return () => cancelAnimation(wave);
  }, [wave, details.waves, listening, reducedMotion]);

  // Размер, а не scale: кнопка стоит в углу и растёт вверх-влево, не наезжая на поле
  const sizeStyle = useAnimatedStyle(() => {
    const from = big ? size.voiceBig : size.voice;
    const to = big ? size.voiceBigListening : size.voiceListening;
    const d = from + (to - from) * grow.get();
    return { width: d, height: d };
  });
  // withTiming — снаружи: это анимация, а не число, и «1 + k * withTiming(…)» даёт NaN — кнопка пропадает
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: reducedMotion ? 1 : withTiming(1 + RING_PULSE * level.get(), { duration: PULSE_MS }),
      },
    ],
  }));
  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: !listening || reducedMotion ? 1 : withTiming(1 + BODY_PULSE * level.get(), { duration: PULSE_MS }),
      },
    ],
  }));

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={sizeStyle}>
      {listening ? (
        <Animated.View style={[styles.pulse, pulseStyle]} />
      ) : details.waves ? (
        WAVES.map(({ phase, still }) => (
          <Wave key={phase} wave={wave} phase={phase} still={reducedMotion ? still : null} />
        ))
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
          style={({ pressed }) => [
            styles.button,
            !listening && (big ? styles.glowBig : styles.glow),
            listening && styles.listening,
            pressed && styles.pressed,
          ]}
        >
          <Icon
            name="mic"
            size={big ? (listening ? 34 : 30) : listening ? 30 : 24}
            color={colors.mark}
            strokeWidth={2.2}
          />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

type WaveProps = {
  wave: SharedValue<number>;
  phase: number;
  still: { scale: number; opacity: number } | null; // null — кольцо движется
};

function Wave({ wave, phase, still }: WaveProps) {
  const styles = useStyles();
  const frame = useAnimatedStyle(() => {
    if (still !== null) return { opacity: still.opacity, transform: [{ scale: still.scale }] };
    const p = (wave.get() + phase) % 1;
    const eased = 1 - (1 - p) ** 2; // быстро отходит от кнопки, у края замедляется
    return {
      opacity: WAVE_OPACITY * (1 - p),
      transform: [{ scale: 1 + WAVE_SCALE * eased }],
    };
  });
  return <Animated.View style={[styles.wave, frame]} />;
}

const useStyles = themedStyles(({ colors, details }) => ({
  // Пока ждёт — неподвижное тонкое кольцо
  ring: {
    position: 'absolute',
    top: -space[14],
    left: -space[14],
    right: -space[14],
    bottom: -space[14],
    borderRadius: circle,
    borderWidth: 2,
    borderColor: colors.micRing,
  },
  wave: {
    ...StyleSheet.absoluteFill,
    borderRadius: circle,
    borderWidth: 1,
    borderColor: colors.accent,
    pointerEvents: 'none',
  },
  pulse: {
    ...StyleSheet.absoluteFill,
    borderRadius: circle,
    backgroundColor: colors.listeningRing,
  },
  // Тень — будто кнопка висит над экраном; в «Голосе» вместо тени свечение
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: circle,
    backgroundColor: colors.accent,
    ...(details.glow === null ? { elevation: 8, shadowColor: colors.shadow } : {}),
  },
  glow: details.glow === null ? {} : { boxShadow: `0 0 30px ${details.glow}` },
  glowBig: details.glow === null ? {} : { boxShadow: `0 0 36px ${details.glow}` },
  listening: {
    backgroundColor: colors.danger,
  },
  pressed: {
    opacity: pressedOpacity,
  },
}));
