import { Keyboard, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { MicButton } from '@/components/mic-button';
import type { Composer } from '@/hooks/use-composer';
import { themedStyles, useTheme } from '@/hooks/use-theme';
import { copy } from '@/lib/copy';
import { circle, pressedOpacity, size, space } from '@/theme';

type Props = { composer: Composer; onType: () => void };

/** Тема «Голос»: внизу вместо поля — «Аа» слева, большая 🎙 по центру, 📷 справа. Тапов на запись столько же. */
export function VoiceBar({ composer: c, onType }: Props) {
  const { colors, text } = useTheme();
  const styles = useStyles();
  const { listening } = c.mic;
  const heard = listening && c.text.trim() !== '';

  // Пока слушает — стоп, услышанное остаётся в поле
  const type = () => {
    if (listening) c.focusField();
    onType();
  };

  // Клавиатура при диктовке не нужна, а без фокуса тап по полю вызовет onFocus — и остановит запись
  const toggleVoice = () => {
    Keyboard.dismiss();
    c.toggleVoice();
  };

  const openCamera = () => {
    Keyboard.dismiss();
    c.openCamera();
  };

  return (
    <View style={styles.bar}>
      <Pressable
        onPress={type}
        accessibilityRole="button"
        accessibilityLabel={copy.a11y.typeTask}
        style={({ pressed }) => [styles.side, pressed && styles.pressed]}
      >
        <Text style={text.buttonSecondary}>{copy.composer.typeButton}</Text>
      </Pressable>
      <View style={styles.center}>
        {/* Высота — как у слушающей: кнопка растёт, а панель не прыгает */}
        <View style={styles.mic}>
          <MicButton big listening={listening} level={c.mic.level} onPress={toggleVoice} />
        </View>
        {heard ? (
          <Text style={[text.body, styles.heard]} numberOfLines={2}>
            {c.text}
          </Text>
        ) : (
          <Text style={[text.mono, styles.caption]}>{copy.voice.touchAndSpeak}</Text>
        )}
      </View>
      <Pressable
        onPress={openCamera}
        accessibilityRole="button"
        accessibilityLabel={copy.photo.take}
        style={({ pressed }) => [styles.side, pressed && styles.pressed]}
      >
        <Icon name="camera" size={20} color={colors.text} />
      </Pressable>
    </View>
  );
}

const useStyles = themedStyles(({ colors }) => ({
  // С отступами футера — 18 сверху, 28 по бокам и 22 снизу, как на доске
  bar: {
    paddingTop: space[8],
    paddingBottom: space[12],
    paddingHorizontal: space[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[12],
  },
  side: {
    width: size.voiceSide,
    height: size.voiceSide,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: circle,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
  },
  center: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: space[10],
  },
  mic: {
    height: size.voiceBigListening,
    justifyContent: 'center',
  },
  caption: {
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  heard: {
    textAlign: 'center',
  },
  pressed: {
    opacity: pressedOpacity,
  },
}));
