import { DEFAULT_SETTINGS, settingsFromRows, settingsToRows } from '@/lib/settings';

describe('settingsFromRows', () => {
  it('пусто — по умолчанию', () => {
    expect(settingsFromRows([])).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.voiceReplies).toBe(true);
    expect(DEFAULT_SETTINGS.voice).toBe('ruslan');
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
    ).toEqual({ ...DEFAULT_SETTINGS, voiceReplies: false });
  });

  it('голос читается как id', () => {
    expect(settingsFromRows([{ key: 'voice', value: 'irina' }]).voice).toBe('irina');
    expect(settingsFromRows([{ key: 'voice', value: 'phone' }]).voice).toBe('phone');
  });

  it('чужой голос — по умолчанию', () => {
    expect(settingsFromRows([{ key: 'voice', value: 'alice' }]).voice).toBe(DEFAULT_SETTINGS.voice);
    expect(settingsFromRows([{ key: 'voice', value: '' }]).voice).toBe(DEFAULT_SETTINGS.voice);
  });
});

describe('settingsToRows', () => {
  it('только переданные поля', () => {
    expect(settingsToRows({ voiceReplies: false })).toEqual([{ key: 'voice_replies', value: '0' }]);
    expect(settingsToRows({ voice: 'denis' })).toEqual([{ key: 'voice', value: 'denis' }]);
    expect(settingsToRows({})).toEqual([]);
  });

  it('туда и обратно', () => {
    expect(settingsFromRows(settingsToRows({ voiceReplies: false }))).toEqual({
      ...DEFAULT_SETTINGS,
      voiceReplies: false,
    });
    expect(
      settingsFromRows(settingsToRows({ voiceReplies: true, voice: 'dmitri', theme: 'day' })),
    ).toEqual({
      voiceReplies: true,
      voice: 'dmitri',
      theme: 'day',
    });
  });

  it('тема — id', () => {
    expect(settingsToRows({ theme: 'night' })).toEqual([{ key: 'theme', value: 'night' }]);
  });
});

describe('тема в настройках', () => {
  it('по умолчанию — как в телефоне', () => {
    expect(settingsFromRows([]).theme).toBe('system');
  });

  it('читается как id', () => {
    expect(settingsFromRows([{ key: 'theme', value: 'day' }]).theme).toBe('day');
  });

  it('чужая тема — по умолчанию', () => {
    expect(settingsFromRows([{ key: 'theme', value: 'voice' }]).theme).toBe('system');
  });
});
