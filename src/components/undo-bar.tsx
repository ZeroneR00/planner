import { useEffect, useEffectEvent, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import type { UndoNotice } from '@/hooks/use-undo';
import { copy } from '@/lib/copy';
import { colors, pressedOpacity, radius, size, space, text } from '@/theme';

const DURATION = 5000; // сколько висит плашка
const FADE = 1500; // последние полторы секунды плавно гаснет

const STROKE = 2;
const CENTER = size.undoRing / 2;
const RADIUS = CENTER - STROKE / 2;
const LENGTH = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  notice: UndoNotice | null;
  onUndo: () => void;
  onExpire: (key: number) => void;
  style?: StyleProp<ViewStyle>;
};

export function UndoBar({ notice, ...rest }: Props) {
  if (notice === null) return null;
  // key — новое действие начинает таймер заново
  return <Toast key={notice.key} notice={notice} {...rest} />;
}

function Toast({ notice, onUndo, onExpire, style }: Props & { notice: UndoNotice }) {
  const progress = useSharedValue(1); // 1 → 0 за DURATION
  const opacity = useSharedValue(1);
  const [secondsLeft, setSecondsLeft] = useState(DURATION / 1000);
  const expire = useEffectEvent(() => onExpire(notice.key));

  useEffect(() => {
    progress.set(withTiming(0, { duration: DURATION, easing: Easing.linear }));
    opacity.set(withDelay(DURATION - FADE, withTiming(0, { duration: FADE })));
    const tick = setInterval(() => setSecondsLeft((n) => Math.max(n - 1, 1)), 1000);
    const done = setTimeout(expire, DURATION);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, [progress, opacity]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: LENGTH * (1 - progress.get()) }));

  return (
    // Появление и затухание — на разных View: иначе entering и opacity спорят за одно свойство
    <Animated.View entering={FadeInDown.duration(250)} style={style}>
      <Animated.View style={fadeStyle}>
        <Pressable
          onPress={onUndo}
          accessibilityRole="button"
          accessibilityLabel={copy.undo.a11y(notice.text)}
          accessibilityLiveRegion="polite"
          style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
        >
          <View style={styles.ring}>
            <Svg width={size.undoRing} height={size.undoRing} style={styles.ringSvg}>
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                stroke={colors.lineStrong}
                strokeWidth={STROKE}
                fill="none"
              />
              <AnimatedCircle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                stroke={colors.accent}
                strokeWidth={STROKE}
                strokeDasharray={LENGTH}
                strokeLinecap="round"
                fill="none"
                animatedProps={ringProps}
              />
            </Svg>
            <Text style={text.monoCount}>{secondsLeft}</Text>
          </View>
          <Text style={[text.label, styles.text]} numberOfLines={1}>
            {notice.text}
          </Text>
          <Text style={text.action}>{copy.undo.back}</Text>
          <Animated.View style={[styles.progress, barStyle]} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: size.field,
    paddingVertical: space[12],
    paddingHorizontal: space[14],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.toast,
    overflow: 'hidden',
  },
  ring: {
    width: size.undoRing,
    height: size.undoRing,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Отсчёт начинается сверху, а не справа
  ringSvg: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  progress: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: size.undoProgress,
    backgroundColor: colors.accent,
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
