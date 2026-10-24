import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { copy } from '@/lib/copy';
import {
  dateParts,
  formatDayLong,
  formatMonthTitle,
  monthGrid,
  monthShift,
  monthStart,
  weekdayHeaders,
} from '@/lib/dates';
import { colors, fonts, pressedOpacity, radius, space, text, touch } from '@/theme';

// Вперёд — не дальше года: дальше планировать в этом приложении незачем
const MAX_SHIFT = 12;

type Props = { today: string; selected: string | null; onPick: (date: string) => void };

export function CalendarSheet({ today, selected, onPick }: Props) {
  // Сдвиг от текущего месяца; открываемся на месяце выбранной даты
  const [shift, setShift] = useState(() =>
    selected === null ? 0 : Math.min(Math.max(monthShift(today, selected), 0), MAX_SHIFT),
  );
  const first = monthStart(today, shift);
  const canBack = shift > 0;
  const canForward = shift < MAX_SHIFT;

  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <Pressable
          onPress={() => setShift(shift - 1)}
          disabled={!canBack}
          accessibilityRole="button"
          accessibilityLabel={copy.composer.prevMonth}
          accessibilityState={{ disabled: !canBack }}
          style={({ pressed }) => [styles.nav, pressed && styles.pressed]}
        >
          <Icon name="back" size={20} color={canBack ? colors.text : colors.disabled} strokeWidth={2.2} />
        </Pressable>
        <Text style={text.calendarTitle}>{formatMonthTitle(first)}</Text>
        <Pressable
          onPress={() => setShift(shift + 1)}
          disabled={!canForward}
          accessibilityRole="button"
          accessibilityLabel={copy.composer.nextMonth}
          accessibilityState={{ disabled: !canForward }}
          style={({ pressed }) => [styles.nav, pressed && styles.pressed]}
        >
          <Icon
            name="forward"
            size={20}
            color={canForward ? colors.text : colors.disabled}
            strokeWidth={2.2}
          />
        </Pressable>
      </View>
      <View style={styles.grid}>
        {weekdayHeaders().map((name) => (
          <View key={name} style={styles.cell}>
            <Text style={[text.caption, styles.weekday]}>{name}</Text>
          </View>
        ))}
        {monthGrid(first).map((date, i) => {
          if (date === null) return <View key={`blank-${i}`} style={styles.cell} />;
          const past = date < today;
          const isToday = date === today;
          const isSelected = date === selected;
          return (
            <View key={date} style={styles.cell}>
              <Pressable
                onPress={() => onPick(date)}
                disabled={past}
                accessibilityRole="button"
                accessibilityLabel={formatDayLong(date, today)}
                accessibilityState={{ selected: isSelected, disabled: past }}
                style={({ pressed }) => [
                  styles.day,
                  isToday && styles.today,
                  isSelected && styles.selected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    text.row,
                    isToday && styles.strong,
                    past && styles.past,
                    isSelected && styles.selectedText,
                  ]}
                >
                  {dateParts(date).day}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingTop: space[6],
    paddingHorizontal: space[10],
    paddingBottom: space[10],
    gap: space[4],
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nav: {
    width: touch,
    height: touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  // 7 в ряд; половина зазора с каждой стороны клетки даёт зазор 2 между клетками
  cell: {
    flexBasis: '14.2857%',
    padding: space[2] / 2,
  },
  weekday: {
    paddingVertical: space[4],
    textAlign: 'center',
  },
  day: {
    height: touch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.chip,
  },
  today: {
    borderWidth: 1,
    borderColor: colors.control,
  },
  selected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  strong: {
    fontFamily: fonts.semibold,
  },
  past: {
    color: colors.disabled,
  },
  selectedText: {
    fontFamily: fonts.semibold,
    color: colors.onAccent,
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
