import {
  DEFAULT_VOICE,
  PHONE_VOICE,
  VOICES,
  isVoiceChoice,
  isVoiceId,
  percent,
  retryDelay,
  voiceUrl,
} from '@/lib/voices';

describe('isVoiceId', () => {
  it('свои голоса', () => {
    for (const voice of VOICES) expect(isVoiceId(voice.id)).toBe(true);
    expect(isVoiceId(DEFAULT_VOICE)).toBe(true);
  });

  it('голос телефона — не свой', () => {
    expect(isVoiceId(PHONE_VOICE)).toBe(false);
  });

  it('чужие и пустая строка', () => {
    expect(isVoiceId('alice')).toBe(false);
    expect(isVoiceId('Ruslan')).toBe(false);
    expect(isVoiceId('')).toBe(false);
  });
});

describe('isVoiceChoice', () => {
  it('свои голоса и голос телефона', () => {
    for (const voice of VOICES) expect(isVoiceChoice(voice.id)).toBe(true);
    expect(isVoiceChoice(PHONE_VOICE)).toBe(true);
  });

  it('чужие и пустая строка', () => {
    expect(isVoiceChoice('google')).toBe(false);
    expect(isVoiceChoice('')).toBe(false);
  });
});

describe('voiceUrl', () => {
  it('int8-архив из релиза tts-models', () => {
    expect(voiceUrl('ruslan')).toBe(
      'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-ru_RU-ruslan-medium-int8.tar.bz2',
    );
    for (const voice of VOICES) {
      expect(voiceUrl(voice.id)).toContain(`vits-piper-ru_RU-${voice.id}-medium-int8.tar.bz2`);
    }
  });
});

describe('retryDelay', () => {
  it('5 с, 15 с, дальше минута', () => {
    expect(retryDelay(0)).toBe(5000);
    expect(retryDelay(1)).toBe(15000);
    expect(retryDelay(2)).toBe(60000);
    expect(retryDelay(10)).toBe(60000);
  });
});

describe('percent', () => {
  it('ноль и половина', () => {
    expect(percent(0, 200)).toBe(0);
    expect(percent(100, 200)).toBe(50);
    expect(percent(1, 3)).toBe(33);
  });

  it('не больше 100', () => {
    expect(percent(300, 200)).toBe(100);
  });

  it('размер неизвестен — 0', () => {
    expect(percent(50, 0)).toBe(0);
    expect(percent(50, -1)).toBe(0);
  });
});
