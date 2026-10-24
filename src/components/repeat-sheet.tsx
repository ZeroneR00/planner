import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import type { RepeatOption } from '@/lib/composer';
import { copy } from '@/lib/copy';
import type { RepeatKind } from '@/lib/types';
import { colors, pressedOpacity, radius, size, space, text } from '@/theme';

type Props = {
  options: readonly RepeatOption[];
  selected: RepeatKind | null;
  onPick: (kind: RepeatKind | null) => void;
};

export function RepeatSheet({ options, selected, onPick }: Props) {
  return (
    <View style={styles.sheet}>
      <Text style={[text.sheetTitle, styles.title]}>{copy.composer.repeat}</Text>
      {options.map((option) => {
        const isSelected = option.kind === selected;
        return (
          <Pressable
            key={option.kind ?? 'once'}
            onPress={() => onPick(option.kind)}
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
  pressed: {
    opacity: pressedOpacity,
  },
});
