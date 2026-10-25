import { copy } from '@/lib/copy';

/** Что показать вместо подписи: у задачи-фото без слов — «Фото». */
export function shownTitle(item: { title: string; photo?: string }): string {
  return item.title === '' && item.photo !== undefined ? copy.photo.untitled : item.title;
}

/** Файлы из папки фото, на которые не ссылается ни задача, ни правило. */
export function unusedPhotos(files: readonly string[], used: ReadonlySet<string>): string[] {
  return files.filter((name) => !used.has(name));
}
