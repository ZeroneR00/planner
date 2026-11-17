import { requireOptionalNativeModule } from 'expo';
import Constants from 'expo-constants';

import { versionLabel } from '@/lib/version';

// Не import из 'expo-updates': он требует нативный модуль сразу при загрузке и роняет
// сборку без него (Expo Go, старая dev-сборка). Те же поля, что читает сам expo-updates.
type UpdatesConstants = { isEnabled?: boolean; isEmbeddedLaunch?: boolean; commitTime?: string };
const updates = requireOptionalNativeModule<UpdatesConstants>('ExpoUpdates');

/** Строка внизу «Настроек»: версия APK и когда прилетело последнее обновление по воздуху. */
export function versionText(): string | null {
  const version = Constants.expoConfig?.version;
  if (!version) return null;
  // Встроенный в APK код — не обновление; в dev-сборке обновления выключены
  const fromAir = updates?.isEnabled && !updates.isEmbeddedLaunch && updates.commitTime;
  return versionLabel(version, fromAir ? new Date(fromAir) : null);
}
