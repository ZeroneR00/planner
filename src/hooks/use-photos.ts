import { Directory, File, Paths } from 'expo-file-system';

import { makeId } from '@/lib/id';
import { unusedPhotos } from '@/lib/photo';

// Единственное место с expo-file-system. В базе — только имя файла, путь собираем здесь:
// папка приложения меняется между Expo Go, своей сборкой и обновлениями

function photosDir(): Directory {
  return new Directory(Paths.document, 'photos');
}

export function photoUri(name: string): string {
  return new File(photosDir(), name).uri;
}

/** Копирует снимок из временного места в папку фото. Возвращает имя файла. */
export async function savePhoto(sourceUri: string): Promise<string> {
  const dir = photosDir();
  dir.create({ idempotent: true, intermediates: true });
  const name = `${makeId()}.jpg`;
  await new File(sourceUri).copy(new File(dir, name));
  return name;
}

/**
 * Уборка при запуске: удаляет файлы, на которые не ссылается ни одна задача или правило.
 * Поэтому «Вернуть» после «Убрать» не нужно заботиться о файле.
 */
export function cleanupPhotos(used: ReadonlySet<string>): void {
  try {
    const dir = photosDir();
    if (!dir.exists) return;
    const files = dir.list().filter((entry): entry is File => entry instanceof File);
    const unused = new Set(unusedPhotos(files.map((file) => file.name), used));
    for (const file of files) {
      if (unused.has(file.name)) file.delete();
    }
  } catch (error) {
    // Не убрали сейчас — уберём при следующем запуске
    if (__DEV__) console.warn('Уборка фото не удалась', error);
  }
}
