// Нижняя панель «Сегодня»: поле записи или «Аа · 🎙 · 📷» темы «Голос»

export type FooterState = {
  footer: 'field' | 'voice';
  micAvailable: boolean;
  editing: boolean;
  typing: boolean; // в поле есть текст
  listening: boolean;
  keyboardShown: boolean;
  fieldOpen: boolean; // тапнули «Аа»
};

/** «Аа · 🎙 · 📷» вместо поля: тема «Голос», голос есть, не правка, и слушает — или поле пустое, закрыто и без клавиатуры. */
export function showVoiceBar(s: FooterState): boolean {
  if (s.footer !== 'voice' || !s.micAvailable || s.editing) return false;
  return s.listening || (!s.typing && !s.keyboardShown && !s.fieldOpen);
}
