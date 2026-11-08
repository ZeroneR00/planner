import { use, useEffect, useRef } from 'react';
import { StyleSheet, View, type ViewInstance } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { RevealScrollContext } from '@/hooks/use-reveal';
import { colors } from '@/theme';

type Props = { offset: number; radius: number };

// Три вспышки по 600 мс укладываются в подсветку (2 с)
const BLINKS = 3;
const HALF_MS = 300;
const DIM = 0.15;

/** Рамка «вот она» после тапа по напоминанию: мигает и докручивает экран до своей строки. */
export function FlashRing({ offset, radius }: Props) {
  const reveal = use(RevealScrollContext);
  const ref = useRef<ViewInstance>(null);
  const revealed = useRef(false);
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    opacity.set(
      withRepeat(
        withSequence(withTiming(1, { duration: HALF_MS }), withTiming(DIM, { duration: HALF_MS })),
        BLINKS,
      ),
    );
  }, [opacity, reducedMotion]);

  const ringStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  // Мерить можно только после раскладки; один раз — дальше человек листает сам
  const onLayout = () => {
    if (revealed.current || ref.current === null) return;
    revealed.current = true;
    reveal?.(ref.current);
  };

  const inset = { top: -offset, left: -offset, right: -offset, bottom: -offset };
  return (
    <View ref={ref} onLayout={onLayout} style={[styles.box, inset]}>
      <Animated.View style={[styles.ring, { borderRadius: radius }, ringStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: colors.accent,
  },
});
