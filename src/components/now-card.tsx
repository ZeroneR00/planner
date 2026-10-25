import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FocusRing } from '@/components/focus-ring';
import { PhotoThumb } from '@/components/photo-thumb';
import { TaskMeta } from '@/components/task-meta';
import { copy } from '@/lib/copy';
import { shownTitle } from '@/lib/photo';
import type { DayItem } from '@/lib/today-view';
import type { Task } from '@/lib/types';
import { colors, pressedOpacity, radius, size, space, text } from '@/theme';

type Props = {
  item: DayItem | null;
  doneCount: number;
  editingId: string | null;
  onDone: (task: Task) => void;
  onLater: (task: Task) => void;
  onEdit: (task: Task) => void;
};

export function NowCard({ item, doneCount, editingId, onDone, onLater, onEdit }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={text.eyebrow}>{copy.today.now}</Text>
        <Text style={text.mono}>{copy.today.doneCount(doneCount)}</Text>
      </View>
      {item === null ? (
        <Text style={text.emptyTitle}>{copy.today.empty}</Text>
      ) : (
        <View style={styles.body}>
          <View style={styles.titleBlock}>
            {item.task.photo !== undefined && <PhotoThumb name={item.task.photo} style={styles.photo} />}
            <Pressable
              onPress={() => onEdit(item.task)}
              hitSlop={space[8]}
              accessibilityRole="button"
              accessibilityLabel={copy.a11y.edit(shownTitle(item.task))}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={[text.nowTitle, item.task.title === '' && styles.untitled]}>
                {shownTitle(item.task)}
              </Text>
              {item.task.id === editingId && <FocusRing offset={space[6]} radius={radius.focus} />}
            </Pressable>
            <TaskMeta time={item.task.time} label={item.repeat} large />
          </View>
          <View style={styles.buttons}>
            <Pressable
              onPress={() => onDone(item.task)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, styles.done, pressed && styles.pressed]}
            >
              <Text style={text.button}>{copy.today.done}</Text>
            </Pressable>
            <Pressable
              onPress={() => onLater(item.task)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, styles.later, pressed && styles.pressed]}
            >
              <Text style={text.buttonSecondary}>{copy.today.later}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: space[20],
    gap: space[14],
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  body: {
    gap: space[18],
  },
  titleBlock: {
    gap: space[6],
  },
  photo: {
    width: '100%',
    height: size.nowPhoto,
    marginBottom: space[8],
    borderRadius: radius.row,
  },
  // «Фото» вместо подписи — вторичным цветом: это не текст задачи
  untitled: {
    color: colors.textSecondary,
  },
  buttons: {
    flexDirection: 'row',
    gap: space[8],
  },
  button: {
    flex: 1,
    height: size.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.row,
  },
  done: {
    backgroundColor: colors.accent,
  },
  later: {
    borderWidth: 1,
    borderColor: colors.outline,
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
