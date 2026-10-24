import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ScrollViewInstance,
} from 'react-native';

import { EdgeFade } from '@/components/edge-fade';
import { Icon } from '@/components/icon';
import type { WhenChip } from '@/lib/composer';
import { colors, pressedOpacity, radius, size, space, text, touch } from '@/theme';

// Правый край растворяется всегда, левый — затемняется, только когда ряд прокручен
const RIGHT_FADE = [
  [0, 0],
  [1, 1],
] as const;
const LEFT_FADE = [
  [0, 0.5],
  [0.3, 0.225],
  [0.6, 0.06],
  [1, 0],
] as const;

const CALENDAR = 'calendar';

type Props = {
  chips: readonly WhenChip[];
  selectedKey: string;
  calendarLabel: string;
  onPick: (date: string | null) => void;
  onOpenCalendar: () => void;
};

type Box = { x: number; width: number };

/** Бегунок «когда»: ближние дни и «Дата». */
export function WhenChips({ chips, selectedKey, calendarLabel, onPick, onOpenCalendar }: Props) {
  // Не useRef: React Compiler не даёт читать ref.current в рендере, а Value нужен в стилях
  const [scrollX] = useState(() => new Animated.Value(0));
  const scrollRef = useRef<ScrollViewInstance>(null);
  const offset = useRef(0);
  const rowWidth = useRef(0);
  const boxes = useRef(new Map<string, Box>());

  // Выбранный чип за краем — подкатываем ряд к нему, оставив слева место для соседа
  const reveal = (key: string) => {
    const box = boxes.current.get(key);
    if (box === undefined || rowWidth.current === 0) return;
    const visibleEnd = offset.current + rowWidth.current - size.fadeRight;
    if (box.x >= offset.current && box.x + box.width <= visibleEnd) return;
    scrollRef.current?.scrollTo({ x: Math.max(0, box.x - size.chipLead), animated: true });
  };
  const revealSelected = useEffectEvent(reveal);
  useEffect(() => {
    revealSelected(selectedKey);
  }, [selectedKey]);

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: true,
  });
  // Смещение для reveal — через подписку на Value, а не listener в onScroll:
  // запись в ref из функции, созданной в рендере, React Compiler считает чтением в рендере
  useEffect(() => {
    const id = scrollX.addListener(({ value }) => {
      offset.current = value;
    });
    return () => scrollX.removeListener(id);
  }, [scrollX]);
  const leftOpacity = scrollX.interpolate({
    inputRange: [0, size.fadeLeftScroll],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const onChipLayout = (key: string, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    boxes.current.set(key, { x, width });
    if (key === selectedKey) reveal(key);
  };

  const items = [
    ...chips.map((chip) => ({ key: chip.key, label: chip.label, onPress: () => onPick(chip.date) })),
    { key: CALENDAR, label: calendarLabel, onPress: onOpenCalendar },
  ];

  return (
    <View style={styles.wrap}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onLayout={(e: LayoutChangeEvent) => {
          rowWidth.current = e.nativeEvent.layout.width;
          reveal(selectedKey);
        }}
        contentContainerStyle={styles.row}
      >
        {items.map((item) => {
          const selected = item.key === selectedKey;
          return (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              onLayout={(e) => onChipLayout(item.key, e)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={({ pressed }) => [styles.chip, selected && styles.chipOn, pressed && styles.pressed]}
            >
              {item.key === CALENDAR && (
                <Icon name="calendar" size={16} color={selected ? colors.onAccent : colors.text} />
              )}
              <Text style={selected ? text.chipOn : text.label}>{item.label}</Text>
            </Pressable>
          );
        })}
      </Animated.ScrollView>
      <View style={[styles.fade, styles.fadeRight]}>
        <EdgeFade stops={RIGHT_FADE} />
      </View>
      <Animated.View style={[styles.fade, styles.fadeLeft, { opacity: leftOpacity }]}>
        <EdgeFade stops={LEFT_FADE} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minWidth: 0,
  },
  // Справа — место под затухание, снизу — под полосу прокрутки
  row: {
    paddingTop: space[2],
    paddingRight: size.fadeRight,
    paddingBottom: space[8],
    gap: space[6],
  },
  chip: {
    height: touch,
    paddingHorizontal: space[14],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[6],
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  chipOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  fade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  fadeRight: {
    right: 0,
    width: size.fadeRight,
  },
  fadeLeft: {
    left: 0,
    width: size.fadeLeft,
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
