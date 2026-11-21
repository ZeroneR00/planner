import { Pressable, Text, View } from 'react-native';

import { FlashRing } from '@/components/flash-ring';
import { FocusRing } from '@/components/focus-ring';
import { PhotoThumb } from '@/components/photo-thumb';
import { TaskMeta } from '@/components/task-meta';
import type { Flash } from '@/hooks/use-reveal';
import { themedStyles, useTheme } from '@/hooks/use-theme';
import { copy } from '@/lib/copy';
import { formatTime } from '@/lib/dates';
import { shownTitle } from '@/lib/photo';
import type { DayItem } from '@/lib/today-view';
import type { Task } from '@/lib/types';
import { circle, fonts, pressedOpacity, size, space } from '@/theme';

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
  const { colors, text, radius, details } = useTheme();
  const styles = useStyles();
  const { nowTime } = details;
  const time = item?.task.time === undefined ? null : formatTime(item.task.time);
  return (
    <View style={styles.card}>
      {details.sticker !== null && <View style={styles.tape} />}
      {details.nowCorners && <Corners />}
      <View style={styles.top}>
        <View style={styles.eyebrow}>
          <View style={styles.dot} />
          {/* «Стикеры»: время прямо в метке — «СЕЙЧАС · 14:00» */}
          <Text style={text.eyebrow}>
            {copy.today.now}
            {nowTime === 'eyebrow' && time !== null && (
              <>
                {' · '}
                <Text style={styles.eyebrowTime}>{time}</Text>
              </>
            )}
          </Text>
        </View>
        {/* «Голос»: справа время задачи, «сделано N» — счётчиком у «Дальше сегодня» */}
        {nowTime === 'right' ? (
          time !== null && <Text style={[text.mono, styles.timeRight]}>{time}</Text>
        ) : (
          <Text style={nowTime === 'eyebrow' ? [text.monoNote, styles.onCard] : [text.mono, styles.secondary]}>
            {copy.today.doneCount(doneCount)}
          </Text>
        )}
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
            <TaskMeta time={nowTime === 'below' ? item.task.time : undefined} label={item.repeat} large />
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

// «Голос»: уголки-скобки цвета акцента поверх рамки карточки
function Corners() {
  const styles = useStyles();
  return (
    <>
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />
    </>
  );
}

const CORNER = 16;
const CORNER_STROKE = 2;
const TAPE = { width: 72, height: 20 } as const;

const useStyles = themedStyles(({ colors, dark, radius, details }) => ({
  card: {
    padding: space[20],
    gap: space[14],
    borderRadius: radius.card,
    backgroundColor: colors.now,
    // В светлой теме карточка приподнята тенью
    ...(dark ? {} : { elevation: 6, shadowColor: colors.shadow }),
    ...(details.framed ? { borderWidth: 1, borderColor: colors.cardBorder } : {}),
    // «Стикеры»: наклон, а сверху место скотчу — иначе ScrollView его обрежет
    ...(details.sticker === null
      ? {}
      : {
          transform: [{ rotate: details.sticker.tilt }],
          marginTop: space[10],
          marginHorizontal: space[2],
          paddingTop: 22,
        }),
  },
  tape: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -TAPE.width / 2,
    width: TAPE.width,
    height: TAPE.height,
    backgroundColor: details.sticker?.tape,
    transform: [{ rotate: '3deg' }],
  },
  // Сдвиг на толщину рамки: уголок ложится ровно на её край
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: colors.accent,
    pointerEvents: 'none',
  },
  topLeft: {
    top: -1,
    left: -1,
    borderTopWidth: CORNER_STROKE,
    borderLeftWidth: CORNER_STROKE,
    borderTopLeftRadius: radius.card,
  },
  topRight: {
    top: -1,
    right: -1,
    borderTopWidth: CORNER_STROKE,
    borderRightWidth: CORNER_STROKE,
    borderTopRightRadius: radius.card,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: CORNER_STROKE,
    borderLeftWidth: CORNER_STROKE,
    borderBottomLeftRadius: radius.card,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: CORNER_STROKE,
    borderRightWidth: CORNER_STROKE,
    borderBottomRightRadius: radius.card,
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
    borderRadius: circle,
    backgroundColor: colors.nowEyebrow,
    ...(details.glow === null ? {} : { boxShadow: `0 0 8px ${details.glow}` }),
  },
  onCard: {
    color: colors.nowText,
  },
  timeRight: {
    letterSpacing: 1,
    color: colors.nowText,
  },
  eyebrowTime: {
    fontFamily: fonts.mono,
    letterSpacing: 0,
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
    borderRadius: radius.button,
  },
  done: {
    backgroundColor: colors.nowDone,
  },
  doneText: {
    color: colors.nowOnDone,
  },
  later: {
    borderWidth: details.laterStroke,
    borderColor: colors.nowLater,
  },
  laterText: {
    color: colors.nowLaterText,
  },
  pressed: {
    opacity: pressedOpacity,
  },
}));
