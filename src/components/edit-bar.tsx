import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { copy } from '@/lib/copy';
import { colors, pressedOpacity, space, text, touch } from '@/theme';

type Props = { rule: boolean; onCancel: () => void };

/** Строка над полем в правке: «✎ Правка» и «Отмена». */
export function EditBar({ rule, onCancel }: Props) {
  return (
    <View style={styles.bar}>
      <View style={styles.title}>
        <Icon name="pencil" size={14} color={colors.accent} />
        <Text style={text.editTitle}>{rule ? copy.composer.editRuleTitle : copy.composer.editTitle}</Text>
      </View>
      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
      >
        <Text style={text.note}>{copy.composer.cancel}</Text>
      </Pressable>
    </View>
  );
}

// Отрицательные отступы — как в прототипе: «Отмена» высотой 44 не раздвигает футер
const styles = StyleSheet.create({
  bar: {
    marginTop: -space[6],
    marginBottom: -space[8],
    paddingLeft: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[8],
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[6],
  },
  cancel: {
    height: touch,
    paddingHorizontal: space[10],
    justifyContent: 'center',
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
