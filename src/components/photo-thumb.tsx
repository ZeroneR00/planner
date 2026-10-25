import { useState } from 'react';
import { Image, Pressable, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';

import { PhotoViewer } from '@/components/photo-viewer';
import { photoUri } from '@/hooks/use-photos';
import { copy } from '@/lib/copy';
import { colors, pressedOpacity, radius, size, touch } from '@/theme';

// Миниатюра 40 — до зоны нажатия 44 добираем hitSlop
const HIT_SLOP = (touch - size.thumb) / 2;

type Props = { name: string; style?: StyleProp<ImageStyle> };

/** Миниатюра фото задачи; тап — фото на весь экран. style — размер, если нужен не 40×40. */
export function PhotoThumb({ name, style }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={copy.photo.open}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Image source={{ uri: photoUri(name) }} resizeMode="cover" style={[styles.thumb, style]} />
      </Pressable>
      {open && <PhotoViewer name={name} onClose={() => setOpen(false)} />}
    </>
  );
}

const styles = StyleSheet.create({
  thumb: {
    width: size.thumb,
    height: size.thumb,
    borderRadius: radius.thumb,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
