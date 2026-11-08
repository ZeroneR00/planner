import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { copy } from '@/lib/copy';
import type { TimeCell, TimeGrid } from '@/lib/time-grid';
import { colors, pressedOpacity, radius, space, text, touch } from '@/theme';

type Props = {
  grid: TimeGrid;
  // close: false — после часа панель остаётся, чтобы выбрать минуты
  onPick: (time: string | null, close: boolean) => void;
};

/** Панель ⏰: «Без времени», утро/день/вечер, часы 0–23 и минуты с шагом 5. */
export function TimeSheet({ grid, onPick }: Props) {
  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <Text style={[text.sheetTitle, styles.title]}>{copy.composer.time}</Text>
        <Pressable
          onPress={() => onPick(null, true)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
        >
          <Text style={text.action}>{copy.composer.noTime}</Text>
        </Pressable>
      </View>
      <View style={styles.presets}>
        {grid.presets.map((cell) => (
          <Cell
            key={cell.key}
            cell={cell}
            style={styles.preset}
            preset
            onPress={() => onPick(cell.time, true)}
          />
        ))}
      </View>
      <View style={styles.grid}>
        {grid.hours.map((cell) => (
          <Cell key={cell.key} cell={cell} style={styles.hour} onPress={() => onPick(cell.time, false)} />
        ))}
      </View>
      <View style={styles.divider} />
      <View style={styles.grid}>
        {grid.minutes.map((cell) => (
          <Cell key={cell.key} cell={cell} style={styles.minute} onPress={() => onPick(cell.time, true)} />
        ))}
      </View>
    </View>
  );
}

type CellProps = {
  cell: TimeCell;
  style: ViewStyle;
  preset?: boolean; // «Утром 9:00» — словом, в рамке, как чип; часы и минуты — цифрами
  onPress: () => void;
};

function Cell({ cell, style, preset = false, onPress }: CellProps) {
  const label = preset
    ? cell.selected
      ? text.chipOn
      : text.label
    : cell.selected
      ? text.timeCellOn
      : text.timeCell;
  return (
    <View style={style}>
      <Pressable
        onPress={onPress}
        disabled={cell.disabled}
        accessibilityRole="button"
        accessibilityLabel={cell.a11y}
        accessibilityState={{ selected: cell.selected, disabled: cell.disabled }}
        style={({ pressed }) => [
          styles.cell,
          preset && styles.presetCell,
          cell.selected && styles.selected,
          pressed && styles.pressed,
        ]}
      >
        <Text numberOfLines={1} style={[label, cell.disabled && !cell.selected && styles.disabled]}>
          {cell.label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    padding: space[6],
    gap: space[4],
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    paddingHorizontal: space[12],
  },
  clear: {
    height: touch,
    paddingHorizontal: space[12],
    justifyContent: 'center',
  },
  presets: {
    flexDirection: 'row',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  // Половина зазора с каждой стороны клетки даёт зазор 2 между клетками
  preset: {
    flex: 1,
    padding: space[2] / 2,
  },
  hour: {
    flexBasis: '12.5%',
    padding: space[2] / 2,
  },
  minute: {
    flexBasis: '16.6667%',
    padding: space[2] / 2,
  },
  cell: {
    height: touch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.chip,
  },
  presetCell: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  selected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  disabled: {
    color: colors.disabled,
  },
  divider: {
    height: 1,
    marginHorizontal: space[6],
    backgroundColor: colors.line,
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
