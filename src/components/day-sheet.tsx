import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarSheet } from '@/components/calendar-sheet';
import { copy } from '@/lib/copy';
import { addDays } from '@/lib/dates';
import { colors, pressedOpacity, radius, size, space, text } from '@/theme';

type Props = { today: string; onPick: (date: string) => void };

/** Меню «Когда?» у стикера. Само встаёт в правый нижний угол; календарь — на всю ширину. */
export function DaySheet({ today, onPick }: Props) {
  const [calendar, setCalendar] = useState(false);

  if (calendar) {
    return (
      <View style={[styles.place, styles.wide]}>
        <CalendarSheet today={today} selected={null} onPick={onPick} />
      </View>
    );
  }

  const days = [
    { label: copy.daySheet.today, date: today },
    { label: copy.daySheet.tomorrow, date: addDays(today, 1) },
  ];
  return (
    <View style={[styles.place, styles.sheet]}>
      <Text style={[text.sheetTitle, styles.title]}>{copy.daySheet.title}</Text>
      {days.map((day) => (
        <Pressable
          key={day.date}
          onPress={() => onPick(day.date)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}
        >
          <Text style={text.row}>{day.label}</Text>
        </Pressable>
      ))}
      <Pressable
        onPress={() => setCalendar(true)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.item, pressed && styles.pressed]}
      >
        <Text style={text.row}>{copy.daySheet.pickDate}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  place: {
    position: 'absolute',
    right: space[12],
    bottom: space[8],
  },
  wide: {
    left: space[12],
  },
  sheet: {
    minWidth: size.daySheet,
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
    justifyContent: 'center',
    borderRadius: radius.chip,
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
