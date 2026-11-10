import { DEFAULT_SETTINGS, settingsFromRows, settingsToRows } from '@/lib/settings';

describe('settingsFromRows', () => {
  it('пусто — по умолчанию', () => {
    expect(settingsFromRows([])).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.voiceReplies).toBe(true);
  });

  it("'0' — выключено", () => {
    expect(settingsFromRows([{ key: 'voice_replies', value: '0' }]).voiceReplies).toBe(false);
  });

  it('битое значение — по умолчанию', () => {
    expect(settingsFromRows([{ key: 'voice_replies', value: 'да' }])).toEqual(DEFAULT_SETTINGS);
  });

  it('чужой ключ не мешает', () => {
    expect(
      settingsFromRows([
        { key: 'theme', value: '0' },
        { key: 'voice_replies', value: '0' },
      ]),
    ).toEqual({ voiceReplies: false });
  });
});

describe('settingsToRows', () => {
  it('только переданные поля', () => {
    expect(settingsToRows({ voiceReplies: false })).toEqual([{ key: 'voice_replies', value: '0' }]);
    expect(settingsToRows({})).toEqual([]);
  });

  it('туда и обратно', () => {
    expect(settingsFromRows(settingsToRows({ voiceReplies: false }))).toEqual({ voiceReplies: false });
    expect(settingsFromRows(settingsToRows({ voiceReplies: true }))).toEqual({ voiceReplies: true });
  });
});
