import { showVoiceBar, type FooterState } from '@/lib/footer';

const idle: FooterState = {
  footer: 'voice',
  micAvailable: true,
  editing: false,
  typing: false,
  listening: false,
  keyboardShown: false,
  fieldOpen: false,
};

describe('showVoiceBar', () => {
  it('пустое закрытое поле в «Голосе» — панель «Аа · 🎙 · 📷»', () => {
    expect(showVoiceBar(idle)).toBe(true);
  });

  it('в теме с полем — всегда поле', () => {
    expect(showVoiceBar({ ...idle, footer: 'field' })).toBe(false);
  });

  it('без модуля голоса (Expo Go) — поле', () => {
    expect(showVoiceBar({ ...idle, micAvailable: false })).toBe(false);
  });

  it('правка задачи — поле', () => {
    expect(showVoiceBar({ ...idle, editing: true })).toBe(false);
    expect(showVoiceBar({ ...idle, editing: true, listening: true })).toBe(false);
  });

  it('тапнули «Аа» — поле', () => {
    expect(showVoiceBar({ ...idle, fieldOpen: true })).toBe(false);
  });

  it('клавиатура открыта — поле', () => {
    expect(showVoiceBar({ ...idle, keyboardShown: true })).toBe(false);
  });

  it('после диктовки в поле остался текст — поле', () => {
    expect(showVoiceBar({ ...idle, typing: true })).toBe(false);
  });

  it('пока слушает — панель, даже с услышанным текстом', () => {
    expect(showVoiceBar({ ...idle, listening: true, typing: true })).toBe(true);
  });
});
