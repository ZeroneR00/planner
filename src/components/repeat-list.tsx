import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FocusRing } from '@/components/focus-ring';
import { Icon } from '@/components/icon';
import { PhotoThumb } from '@/components/photo-thumb';
import { TaskMeta } from '@/components/task-meta';
import type { AheadRule } from '@/lib/ahead-view';
import { copy } from '@/lib/copy';
import { shownTitle } from '@/lib/photo';
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
          {rule.photo !== undefined && <PhotoThumb name={rule.photo} />}
          <Pressable
            onPress={() => onEdit(rule)}
            accessibilityRole="button"
            accessibilityLabel={copy.a11y.edit(shownTitle(rule))}
            style={({ pressed }) => [styles.main, pressed && styles.pressed]}
          >
            <Text style={[text.row, rule.title === '' && styles.untitled]}>{shownTitle(rule)}</Text>
            <TaskMeta time={rule.time} label={label} icon={false} />
          </Pressable>
          <Pressable
            onPress={() => onStop(rule)}
            accessibilityRole="button"
            accessibilityLabel={copy.a11y.stop(shownTitle(rule))}
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
  // «Фото» вместо подписи — вторичным цветом: это не текст задачи
  untitled: {
    color: colors.textSecondary,
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
