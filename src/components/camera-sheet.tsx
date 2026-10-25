import { CameraView, useCameraPermissions } from 'expo-camera';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { copy } from '@/lib/copy';
import { colors, pressedOpacity, radius, size, space, text, touch } from '@/theme';

const QUALITY = 0.7; // снимку задачи хватает, а файл в разы меньше

type Props = { onPhoto: (uri: string) => void; onClose: () => void };

/** Видоискатель на весь экран: × сверху, снизу галерея и спуск. */
export function CameraSheet({ onPhoto, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  // Первый раз — системный вопрос сразу при открытии, без своих экранов
  useEffect(() => {
    if (permission !== null && !permission.granted && permission.canAskAgain) void requestPermission();
  }, [permission, requestPermission]);

  // Вернулись из настроек — разрешение могло появиться
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void getPermission();
    });
    return () => sub.remove();
  }, [getPermission]);

  const shoot = async () => {
    if (busy || !ready || cameraRef.current === null) return;
    setBusy(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: QUALITY });
      onPhoto(picture.uri);
    } catch (error) {
      if (__DEV__) console.warn('Снимок не получился', error);
      setBusy(false);
    }
  };

  const pick = async () => {
    const result = await launchImageLibraryAsync({ mediaTypes: ['images'], quality: QUALITY });
    const asset = result.canceled ? undefined : result.assets[0];
    if (asset !== undefined) onPhoto(asset.uri);
  };

  const granted = permission?.granted === true;
  const denied = permission !== null && !permission.granted && !permission.canAskAgain;
  const canShoot = granted && ready && !busy;

  return (
    <Modal
      visible
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {granted && (
          <CameraView
            ref={cameraRef}
            facing="back"
            onCameraReady={() => setReady(true)}
            style={StyleSheet.absoluteFill}
          />
        )}
        {denied && (
          <View style={styles.noAccess}>
            <Text style={[text.body, styles.noAccessText]}>{copy.photo.noAccess}</Text>
            <Pressable
              onPress={() => void Linking.openSettings()}
              accessibilityRole="button"
              style={({ pressed }) => [styles.settings, pressed && styles.pressed]}
            >
              <Text style={text.buttonSecondary}>{copy.photo.settings}</Text>
            </Pressable>
          </View>
        )}
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={copy.photo.close}
          style={({ pressed }) => [
            styles.round,
            styles.close,
            { top: insets.top + space[8] },
            pressed && styles.pressed,
          ]}
        >
          <Icon name="close" size={22} color={colors.text} />
        </Pressable>
        <View style={[styles.bottom, { paddingBottom: insets.bottom + space[24] }]}>
          <Pressable
            onPress={() => void pick()}
            accessibilityRole="button"
            accessibilityLabel={copy.photo.gallery}
            style={({ pressed }) => [styles.round, styles.side, pressed && styles.pressed]}
          >
            <Icon name="image" size={24} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => void shoot()}
            disabled={!canShoot}
            accessibilityRole="button"
            accessibilityLabel={copy.photo.shoot}
            accessibilityState={{ disabled: !canShoot }}
            style={({ pressed }) => [styles.shutter, (!canShoot || pressed) && styles.pressed]}
          >
            <View style={styles.shutterCore} />
          </Pressable>
          {/* Пустое место той же ширины, что галерея: спуск ровно по центру */}
          <View style={styles.side} />
        </View>
      </View>
    </Modal>
  );
}

const SIDE = 52; // кнопка галереи — крупнее ×, её нажимают чаще

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.photoBackdrop,
  },
  noAccess: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[16],
    paddingHorizontal: space[24],
  },
  noAccessText: {
    textAlign: 'center',
  },
  settings: {
    height: size.button,
    paddingHorizontal: space[20],
    justifyContent: 'center',
    borderRadius: radius.row,
    backgroundColor: colors.surface,
  },
  round: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.cameraButton,
  },
  close: {
    position: 'absolute',
    left: space[12],
    width: touch,
    height: touch,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[24],
  },
  side: {
    width: SIDE,
    height: SIDE,
  },
  shutter: {
    width: size.shutter,
    height: size.shutter,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.shutter,
    borderRadius: radius.pill,
  },
  shutterCore: {
    width: size.shutter - 16,
    height: size.shutter - 16,
    borderRadius: radius.pill,
    backgroundColor: colors.shutter,
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
