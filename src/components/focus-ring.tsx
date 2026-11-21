import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = { offset: number; radius: number; color?: string }; // color — по умолчанию акцент

/** Рамка правки поверх элемента: рисуется отдельно, поэтому разметка не прыгает. */
export function FocusRing({ offset, radius, color }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.ring,
        {
          top: -offset,
          left: -offset,
          right: -offset,
          bottom: -offset,
          borderRadius: radius,
          borderColor: color ?? colors.accent,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 1,
    pointerEvents: 'none',
  },
});
