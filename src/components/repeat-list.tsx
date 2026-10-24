import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FocusRing } from '@/components/focus-ring';
import { Icon } from '@/components/icon';
import type { AheadRule } from '@/lib/ahead-view';
import { copy } from '@/lib/copy';
import type { Rule } from '@/lib/types';
import { colors, pressedOpacity, radius, size, space, text, touch } from '@/theme';

type Props = {
  rules: readonly AheadRule[];
  editingRuleId: string | null;
  onEdit: (rule: Rule) => void;
  onStop: (rule: Rule) => void;
};

/** «Повторяется» на экране «Впереди». Повторов нет — раздела нет. */
export function RepeatList({ rules, editingRuleId, onEdit, onStop }: Props) {
  if (rules.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={[text.section, styles.heading]}>{copy.ahead.repeating}</Text>
      {rules.map(({ rule, label }) => (
        <View key={rule.id} style={styles.row}>
          <Icon name="loop" size={16} color={colors.accent} strokeWidth={2} />
          <Pressable
            onPress={() => onEdit(rule)}
            accessibilityRole="button"
            accessibilityLabel={copy.a11y.edit(rule.title)}
            style={({ pressed }) => [styles.main, pressed && styles.pressed]}
          >
            <Text style={text.row}>{rule.title}</Text>
            <Text style={text.meta}>{label}</Text>
          </Pressable>
          <Pressable
            onPress={() => onStop(rule)}
            accessibilityRole="button"
            accessibilityLabel={copy.a11y.stop(rule.title)}
            style={({ pressed }) => [styles.stop, pressed && styles.pressed]}
          >
            <Text style={text.note}>{copy.ahead.stop}</Text>
          </Pressable>
          {rule.id === editingRuleId && <FocusRing offset={0} radius={radius.row} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: space[4],
  },
  heading: {
    paddingHorizontal: space[4],
    paddingBottom: space[6],
  },
  row: {
    minHeight: size.row,
    paddingLeft: space[14],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[10],
    borderRadius: radius.row,
    backgroundColor: colors.row,
  },
  main: {
    flex: 1,
    minWidth: 0,
    paddingVertical: space[8],
    gap: space[2],
  },
  stop: {
    height: touch,
    paddingHorizontal: space[14],
    justifyContent: 'center',
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
