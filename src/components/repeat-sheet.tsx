import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import type { RepeatOption } from '@/lib/composer';
import { copy } from '@/lib/copy';
import { WEEK_ORDER, at, capitalize, weekdayHeaders } from '@/lib/dates';
import type { RepeatKind, RepeatPattern } from '@/lib/types';
import { colors, pressedOpacity, radius, size, space, text, touch } from '@/theme';

type Props = {
  options: readonly RepeatOption[];
  selected: RepeatKind | null;
  weekdays: readonly number[];
  onPick: (repeat: RepeatPattern | null) => void;
  onToggleDay: (weekday: number) => void;
};

export function RepeatSheet({ options, selected, weekdays, onPick, onToggleDay }: Props) {
  return (
    <View style={styles.sheet}>
      <Text style={[text.sheetTitle, styles.title]}>{copy.composer.repeat}</Text>
      {options.map((option) => {
        const isSelected = (option.pattern?.kind ?? null) === selected;
        return (
          <Fragment key={option.key}>
            <Pressable
              onPress={() => onPick(option.pattern)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              style={({ pressed }) => [
                styles.item,
                isSelected && styles.itemSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[text.row, styles.label]}>{option.label}</Text>
              {isSelected && <Icon name="check" size={18} color={colors.accent} strokeWidth={2.4} />}
            </Pressable>
            {option.key === 'weekly' && <DayRow weekdays={weekdays} onToggle={onToggleDay} />}
          </Fragment>
        );
      })}
    </View>
  );
}

function DayRow({ weekdays, onToggle }: { weekdays: readonly number[]; onToggle: (weekday: number) => void }) {
  const names = weekdayHeaders();
  return (
    <View style={styles.days}>
      {WEEK_ORDER.map((weekday, i) => {
        const isOn = weekdays.includes(weekday);
        return (
          <Pressable
            key={weekday}
            onPress={() => onToggle(weekday)}
            accessibilityRole="button"
            accessibilityLabel={capitalize(at(copy.repeat.weeklyPlural, weekday))}
            accessibilityState={{ selected: isOn }}
            style={({ pressed }) => [styles.day, isOn && styles.dayOn, pressed && styles.pressed]}
          >
            <Text style={isOn ? text.chipOn : text.label}>{at(names, i)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    padding: space[6],
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
  },
  title: {
    paddingTop: space[8],
    paddingHorizontal: space[12],
    paddingBottom: space[6],
  },
  item: {
    minHeight: size.menuItem,
    paddingHorizontal: space[12],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[8],
    borderRadius: radius.chip,
  },
  itemSelected: {
    backgroundColor: colors.surfaceSelected,
  },
  label: {
    flexShrink: 1,
  },
  days: {
    flexDirection: 'row',
    gap: space[2],
    paddingVertical: space[4],
  },
  day: {
    flex: 1,
    height: touch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.chip,
  },
  dayOn: {
    backgroundColor: colors.accent,
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
