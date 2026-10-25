import { Image, Modal, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { photoUri } from '@/hooks/use-photos';
import { copy } from '@/lib/copy';
import { colors, radius, space, touch } from '@/theme';

type Props = { name: string; onClose: () => void };

/** Фото на весь экран. Закрывает тап в любом месте, × и «Назад». */
export function PhotoViewer({ name, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={copy.photo.close}
        style={styles.root}
      >
        <Image source={{ uri: photoUri(name) }} resizeMode="contain" style={StyleSheet.absoluteFill} />
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={copy.photo.close}
          style={[styles.close, { top: insets.top + space[8] }]}
        >
          <Icon name="close" size={22} color={colors.text} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.photoBackdrop,
  },
  close: {
    position: 'absolute',
    left: space[12],
    width: touch,
    height: touch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.cameraButton,
  },
});
