import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FocusRing } from '@/components/focus-ring';
import { Icon } from '@/components/icon';
import { PhotoThumb } from '@/components/photo-thumb';
import { TaskMeta } from '@/components/task-meta';
import type { AheadDay } from '@/lib/ahead-view';
import { copy } from '@/lib/copy';
import { shownTitle } from '@/lib/photo';
import type { Task } from '@/lib/types';
import { colors, pressedOpacity, radius, size, space, text, touch } from '@/theme';

type Props = {
  days: readonly AheadDay[];
  editingId: string | null;
  onEdit: (task: Task) => void;
  onRemove: (task: Task) => void;
};

export function AheadDays({ days, editingId, onEdit, onRemove }: Props) {
  if (days.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={text.hint}>{copy.ahead.empty}</Text>
      </View>
    );
  }
  return days.map((day) => (
    <View key={day.date} style={styles.section}>
      <Text style={[text.dayTitle, styles.heading]}>{day.label}</Text>
      {day.tasks.map((task) => (
        <View key={task.id} style={styles.row}>
          {task.photo !== undefined && <PhotoThumb name={task.photo} style={styles.thumb} />}
          <Pressable
            onPress={() => onEdit(task)}
            accessibilityRole="button"
            accessibilityLabel={copy.a11y.edit(shownTitle(task))}
            style={({ pressed }) => [styles.main, pressed && styles.pressed]}
          >
            <Text style={[text.row, task.title === '' && styles.untitled]}>{shownTitle(task)}</Text>
            <TaskMeta time={task.time} />
          </Pressable>
          <Pressable
            onPress={() => onRemove(task)}
            accessibilityRole="button"
            accessibilityLabel={copy.a11y.remove(shownTitle(task))}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Icon name="close" size={18} color={colors.textSecondary} strokeWidth={2} />
          </Pressable>
          {task.id === editingId && <FocusRing offset={0} radius={radius.row} />}
        </View>
      ))}
    </View>
  ));
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
    borderRadius: radius.row,
    backgroundColor: colors.row,
  },
  main: {
    flex: 1,
    minWidth: 0,
    paddingVertical: space[10],
    gap: space[2],
  },
  // «Фото» вместо подписи — вторичным цветом: это не текст задачи
  untitled: {
    color: colors.textSecondary,
  },
  thumb: {
    marginRight: space[12],
  },
  iconButton: {
    width: touch,
    height: touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    padding: space[14],
    borderRadius: radius.row,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.lineStrong,
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
