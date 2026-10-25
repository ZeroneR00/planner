import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FocusRing } from '@/components/focus-ring';
import { Icon } from '@/components/icon';
import { TaskMeta } from '@/components/task-meta';
import { copy } from '@/lib/copy';
import type { DayItem } from '@/lib/today-view';
import type { Task } from '@/lib/types';
import { colors, pressedOpacity, radius, size, space, text, touch } from '@/theme';

type Props = {
  items: readonly DayItem[];
  editingId: string | null;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
};

export function RestList({ items, editingId, onToggle, onEdit }: Props) {
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={[text.section, styles.heading]}>{copy.today.rest}</Text>
      {items.map(({ task, repeat }) => (
        <View key={task.id} style={[styles.row, task.id === editingId && styles.rowEditing]}>
          <Pressable
            onPress={() => onToggle(task)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: task.done }}
            accessibilityLabel={task.done ? copy.a11y.uncheck(task.title) : copy.a11y.check(task.title)}
            style={({ pressed }) => [styles.check, pressed && styles.pressed]}
          >
            <View style={[styles.circle, task.done && styles.circleDone]}>
              {task.done && <Icon name="check" size={13} color={colors.onAccent} strokeWidth={3} />}
            </View>
          </Pressable>
          <Pressable
            onPress={() => onEdit(task)}
            accessibilityRole="button"
            accessibilityLabel={copy.a11y.edit(task.title)}
            style={({ pressed }) => [styles.main, pressed && styles.pressed]}
          >
            <Text style={[text.body, task.done && styles.titleDone]}>{task.title}</Text>
            <TaskMeta
              time={task.time}
              label={repeat !== null && task.done ? `${repeat} · ${copy.repeat.doneToday}` : repeat}
              done={task.done}
            />
          </Pressable>
          {task.id === editingId && <FocusRing offset={0} radius={radius.row} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: space[2],
  },
  heading: {
    paddingHorizontal: space[4],
    paddingBottom: space[6],
  },
  row: {
    minHeight: size.row,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    borderRadius: radius.row,
  },
  rowEditing: {
    backgroundColor: colors.surface,
  },
  check: {
    width: touch,
    height: touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: size.checkbox,
    height: size.checkbox,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: size.checkbox / 2,
    borderWidth: 2,
    borderColor: colors.control,
  },
  circleDone: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  main: {
    flex: 1,
    minWidth: 0,
    gap: space[2],
    paddingVertical: space[6],
    paddingRight: space[10],
  },
  titleDone: {
    color: colors.textDone,
    textDecorationLine: 'line-through',
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
