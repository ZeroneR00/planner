import { Pressable, Text, View } from 'react-native';

import { ThemePreview } from '@/components/theme-preview';
import { themedStyles, useTheme } from '@/hooks/use-theme';
import { copy } from '@/lib/copy';
import { THEME_NAMES, type ThemeName } from '@/lib/theme-choice';
import { pressedOpacity, radius, space } from '@/theme';

type Props = { active: ThemeName; followPhone: boolean; onPick: (name: ThemeName) => void };

/** Картинки тем в ряд: подсвечена та, что на экране; при «Как в телефоне» под ней — «сейчас». */
export function ThemePicker({ active, followPhone, onPick }: Props) {
  const { text } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.row}>
      {THEME_NAMES.map((name) => {
        const on = name === active;
        return (
          <Pressable
            key={name}
            onPress={() => onPick(name)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={copy.settings.themes[name]}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
          >
            {/* Рамка снаружи картинки: у активной толще, но размер плитки не прыгает */}
            <View style={[styles.frame, on ? styles.frameOn : styles.frameOff]}>
              <ThemePreview name={name} />
            </View>
            <Text style={[on ? text.action : text.note, styles.name]}>
              {copy.settings.themes[name]}
            </Text>
            {on && followPhone && (
              <Text style={[text.caption, styles.name]}>{copy.settings.themeNow}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const FRAME = 2; // толщина рамки активной картинки

const useStyles = themedStyles(({ colors }) => ({
  // Прижат влево: четыре картинки (этап с темами Голос и Стикеры) влезут в ряд
  row: {
    flexDirection: 'row',
    gap: space[10],
  },
  tile: {
    alignItems: 'center',
    gap: space[6],
  },
  frame: {
    borderRadius: radius.chip + FRAME + space[2],
  },
  frameOn: {
    padding: space[2],
    borderWidth: FRAME,
    borderColor: colors.accent,
  },
  // Тоньше на 1 — добираем отступом, чтобы картинка стояла на месте
  frameOff: {
    padding: space[2] + FRAME - 1,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  name: {
    textAlign: 'center',
  },
  pressed: {
    opacity: pressedOpacity,
  },
}));
