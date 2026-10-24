import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { copy } from '@/lib/copy';
import type { Task } from '@/lib/types';
import { colors, pressedOpacity, radius, size, space, text, touch } from '@/theme';

type Props = {
  tasks: readonly Task[];
  onMarkDone: (task: Task) => void;
  onToToday: (task: Task) => void;
  onRemove: (task: Task) => void;
};

export function PocketList({ tasks, onMarkDone, onToToday, onRemove }: Props) {
  return (
    <View style={styles.section}>
      <Text style={[text.section, styles.heading]}>{copy.pocket.title(tasks.length)}</Text>
      {tasks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={text.hint}>{copy.pocket.empty}</Text>
        </View>
      ) : (
        tasks.map((task) => (
          <View key={task.id} style={styles.row}>
            <View style={styles.main}>
              <Text style={[text.row, styles.title]}>{task.title}</Text>
              {task.returned === true && (
                <View style={styles.meta}>
                  <Icon name="return" size={12} color={colors.warning} />
                  <Text style={[text.meta, styles.warning]}>{copy.pocket.returned}</Text>
                </View>
              )}
            </View>
            {task.returned === true && (
              <Pressable
                onPress={() => onMarkDone(task)}
                accessibilityRole="button"
                accessibilityLabel={copy.a11y.markDone(task.title)}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              >
                <Icon name="check" size={20} color={colors.accent} strokeWidth={2.4} />
              </Pressable>
            )}
            <Pressable
              onPress={() => onToToday(task)}
              accessibilityRole="button"
              accessibilityLabel={copy.a11y.toToday(task.title)}
              style={({ pressed }) => [styles.toToday, pressed && styles.pressed]}
            >
              <Text style={text.action}>{copy.pocket.toToday}</Text>
            </Pressable>
            <Pressable
              onPress={() => onRemove(task)}
              accessibilityRole="button"
              accessibilityLabel={copy.a11y.remove(task.title)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            >
              <Icon name="close" size={18} color={colors.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>
        ))
      )}
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
    borderRadius: radius.row,
    backgroundColor: colors.row,
  },
  main: {
    flex: 1,
    minWidth: 0,
    paddingVertical: space[6],
  },
  title: {
    paddingVertical: space[4],
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
  },
  warning: {
    color: colors.warning,
  },
  iconButton: {
    width: touch,
    height: touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toToday: {
    height: touch,
    paddingHorizontal: space[10],
    justifyContent: 'center',
    borderRadius: radius.chip,
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
