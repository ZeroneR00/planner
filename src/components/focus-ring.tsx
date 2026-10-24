import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

type Props = { offset: number; radius: number };

/** Рамка правки поверх элемента: рисуется отдельно, поэтому разметка не прыгает. */
export function FocusRing({ offset, radius }: Props) {
  return (
    <View style={[styles.ring, { top: -offset, left: -offset, right: -offset, bottom: -offset, borderRadius: radius }]} />
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: colors.accent,
    pointerEvents: 'none',
  },
});
