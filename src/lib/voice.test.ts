import { copy } from '@/lib/copy';
import { endsSpeech, listeningHint, micLevel, spokenText, voiceError, voiceHint } from '@/lib/voice';

describe('endsSpeech', () => {
  it('тишина — обычный конец', () => {
    expect(endsSpeech('no-speech', false)).toBe(true);
    expect(endsSpeech('speech-timeout', false)).toBe(true);
  });

  it('после нашего «хватит» — любая ошибка обычный конец', () => {
    expect(endsSpeech('client', true)).toBe(true);
    expect(endsSpeech('network', true)).toBe(true);
  });

  it('сеть посреди речи — не конец: текст остаётся в поле', () => {
    expect(endsSpeech('network', false)).toBe(false);
    expect(endsSpeech('client', false)).toBe(false);
  });
});

describe('spokenText', () => {
  it('куски речи через пробел, недоговорённый — в конце', () => {
    expect(spokenText(['Позвонить маме', 'завтра'], 'с утра')).toBe('Позвонить маме завтра с утра');
  });

  it('пустые куски и лишние пробелы не мешают', () => {
    expect(spokenText([' позвонить ', ''], '')).toBe('позвонить');
    expect(spokenText([], '')).toBe('');
  });
});

describe('voiceError', () => {
  it('прервали сами — молчим', () => {
    expect(voiceError('aborted')).toBeNull();
  });

  it('тишина — «не расслышал»', () => {
    expect(voiceError('no-speech')).toBe('notHeard');
    expect(voiceError('speech-timeout')).toBe('notHeard');
  });

  it('нет разрешения и нет сети', () => {
    expect(voiceError('not-allowed')).toBe('noAccess');
    expect(voiceError('network')).toBe('offline');
  });

  it('прочее — «не получилось»', () => {
    expect(voiceError('busy')).toBe('failed');
    expect(voiceError('что-то новое')).toBe('failed');
  });
});

describe('micLevel', () => {
  it('приводит к 0…1 с обрезкой', () => {
    expect(micLevel(-2)).toBe(0);
    expect(micLevel(10)).toBe(1);
    expect(micLevel(4)).toBe(0.5);
    expect(micLevel(-5)).toBe(0);
    expect(micLevel(20)).toBe(1);
  });
});

describe('подсказки', () => {
  it('тексты — из copy.voice', () => {
    expect(voiceHint('notHeard')).toEqual({ accent: false, parts: [{ text: copy.voice.notHeard }] });
    expect(listeningHint.parts[0]?.text).toBe(copy.voice.listening);
  });
});
