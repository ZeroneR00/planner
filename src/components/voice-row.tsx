import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { themedStyles, useTheme } from '@/hooks/use-theme';
import { copy } from '@/lib/copy';
import type { VoiceState } from '@/lib/voices';
import { pressedOpacity, size, space, touch } from '@/theme';

type Props = {
  name: string;
  note: ReactNode;
  selected: boolean;
  onSelect: () => void;
  onListen: () => void;
};

function StateNote({ state }: { state: VoiceState }) {
  const { text } = useTheme();
  switch (state.kind) {
    case 'ready':
      return copy.voices.ready;
    case 'waiting':
      return copy.voices.waiting;
    case 'none':
      return copy.voices.none;
    case 'loading':
      return (
        <>
          {copy.voices.loading} <Text style={text.monoNote}>{state.percent}%</Text>
        </>
      );
  }
}

/** Подпись своего голоса: «Мужской · Скачивается 45%». */
export function OwnVoiceNote({ male, state }: { male: boolean; state: VoiceState }) {
  return (
    <>
      {male ? copy.voices.male : copy.voices.female} · <StateNote state={state} />
    </>
  );
}

/** Голос в настройках: тап по строке — выбрать, ▶ — только послушать образец. */
export function VoiceRow({ name, note, selected, onSelect, onListen }: Props) {
  const { colors, text } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.mark}>
        {selected && <Icon name="check" size={20} color={colors.accent} strokeWidth={2.4} />}
      </View>
      <View style={styles.texts}>
        <Text style={text.row}>{name}</Text>
        <Text style={text.note}>{note}</Text>
      </View>
      <Pressable
        onPress={onListen}
        accessibilityRole="button"
        accessibilityLabel={copy.voices.listen(name)}
        style={({ pressed }) => [styles.listen, pressed && styles.pressed]}
      >
        <Icon name="play" size={20} color={colors.text} strokeWidth={2} />
      </Pressable>
    </Pressable>
  );
}

const useStyles = themedStyles(({ colors, text, radius }) => ({
  row: {
    minHeight: size.row,
    paddingLeft: space[12],
    paddingRight: space[4],
    paddingVertical: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    borderRadius: radius.row,
    backgroundColor: colors.row,
  },
  mark: {
    width: 20,
    alignItems: 'center',
  },
  texts: {
    flex: 1,
    minWidth: 0,
    gap: space[2],
  },
  listen: {
    width: touch,
    height: touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: pressedOpacity,
  },
}));
