import { copy } from '@/lib/copy';
import { shownTitle, unusedPhotos } from '@/lib/photo';

describe('shownTitle', () => {
  it('фото без подписи — «Фото»', () => {
    expect(shownTitle({ title: '', photo: 'a.jpg' })).toBe(copy.photo.untitled);
  });

  it('фото с подписью — подпись', () => {
    expect(shownTitle({ title: 'чек за свет', photo: 'a.jpg' })).toBe('чек за свет');
  });

  it('без фото — как есть', () => {
    expect(shownTitle({ title: 'созвон' })).toBe('созвон');
  });
});

describe('unusedPhotos', () => {
  it('оставляет только файлы без ссылок', () => {
    expect(unusedPhotos(['a.jpg', 'b.jpg', 'c.jpg'], new Set(['b.jpg', 'x.jpg']))).toEqual(['a.jpg', 'c.jpg']);
  });

  it('пустая папка — пусто', () => {
    expect(unusedPhotos([], new Set(['a.jpg']))).toEqual([]);
  });
});
