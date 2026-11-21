import { Pressable, Text, View } from 'react-native';

import { FlashRing } from '@/components/flash-ring';
import { FocusRing } from '@/components/focus-ring';
import { PhotoThumb } from '@/components/photo-thumb';
import { TaskMeta } from '@/components/task-meta';
import type { Flash } from '@/hooks/use-reveal';
import { themedStyles, useTheme } from '@/hooks/use-theme';
import { copy } from '@/lib/copy';
import { shownTitle } from '@/lib/photo';
import type { DayItem } from '@/lib/today-view';
import type { Task } from '@/lib/types';
import { pressedOpacity, radius, size, space } from '@/theme';

type Props = {
  item: DayItem | null;
  doneCount: number;
  editingId: string | null;
  flash: Flash | null; // подсветка после тапа по напоминанию
  onDone: (task: Task) => void;
  onLater: (task: Task) => void;
  onEdit: (task: Task) => void;
};

export function NowCard({ item, doneCount, editingId, flash, onDone, onLater, onEdit }: Props) {
  const { colors, text } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.eyebrow}>
          <View style={styles.dot} />
          <Text style={text.eyebrow}>{copy.today.now}</Text>
        </View>
        <Text style={[text.mono, styles.secondary]}>{copy.today.doneCount(doneCount)}</Text>
      </View>
      {item === null ? (
        <Text style={[text.emptyTitle, styles.onCard]}>{copy.today.empty}</Text>
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
              <Text style={[text.nowTitle, item.task.title === '' && styles.secondary]}>
                {shownTitle(item.task)}
              </Text>
              {item.task.id === editingId && (
                <FocusRing offset={space[6]} radius={radius.focus} color={colors.nowRing} />
              )}
              {flash?.id === item.task.id && (
                <FlashRing key={flash.key} offset={space[6]} radius={radius.focus} color={colors.nowRing} />
              )}
            </Pressable>
            <TaskMeta time={item.task.time} label={item.repeat} large />
          </View>
          <View style={styles.buttons}>
            <Pressable
              onPress={() => onDone(item.task)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, styles.done, pressed && styles.pressed]}
            >
              <Text style={[text.button, styles.doneText]}>{copy.today.done}</Text>
            </Pressable>
            <Pressable
              onPress={() => onLater(item.task)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, styles.later, pressed && styles.pressed]}
            >
              <Text style={[text.buttonSecondary, styles.laterText]}>{copy.today.later}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const useStyles = themedStyles(({ colors, dark }) => ({
  card: {
    padding: space[20],
    gap: space[14],
    borderRadius: radius.card,
    backgroundColor: colors.now,
    // В светлой теме карточка приподнята тенью
    ...(dark ? {} : { elevation: 6, shadowColor: colors.shadow }),
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  dot: {
    width: space[8],
    height: space[8],
    borderRadius: radius.pill,
    backgroundColor: colors.nowEyebrow,
  },
  onCard: {
    color: colors.nowText,
  },
  // «сделано N» и «Фото» вместо подписи — вторичным цветом: это не текст задачи
  secondary: {
    color: colors.nowSecondary,
  },
  body: {
    gap: space[16],
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
  buttons: {
    flexDirection: 'row',
    gap: space[8],
  },
  button: {
    flex: 1,
    height: size.nowButton,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.field,
  },
  done: {
    backgroundColor: colors.nowDone,
  },
  doneText: {
    color: colors.nowOnDone,
  },
  later: {
    borderWidth: 1,
    borderColor: colors.nowLater,
  },
  laterText: {
    color: colors.nowLaterText,
  },
  pressed: {
    opacity: pressedOpacity,
  },
}));
