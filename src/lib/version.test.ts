import { versionLabel } from '@/lib/version';

describe('versionLabel', () => {
  it('без обновления — только версия', () => {
    expect(versionLabel('1.0.0', null)).toBe('Версия 1.0.0');
  });

  it('с обновлением — дата и время', () => {
    expect(versionLabel('1.0.0', new Date(2026, 10, 16, 15, 40))).toBe(
      'Версия 1.0.0 · обновление 16 ноября, 15:40',
    );
  });

  it('утреннее время без ведущего нуля', () => {
    expect(versionLabel('1.0.0', new Date(2026, 10, 16, 9, 5))).toBe(
      'Версия 1.0.0 · обновление 16 ноября, 9:05',
    );
  });
});
