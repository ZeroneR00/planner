import { StyleSheet, View } from 'react-native';

import type { ThemeName } from '@/lib/theme-choice';
import { radius, size, space, themes } from '@/theme';

/** Мини-«Сегодня» в цветах темы name (а не той, что на экране): картинка темы в «Настройках». */
export function ThemePreview({ name }: { name: ThemeName }) {
  const c = themes[name].colors;
  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.body}>
        <View style={[styles.date, { backgroundColor: c.textSecondary }]} />
        <View style={[styles.title, { backgroundColor: c.text }]} />
        <View style={[styles.now, { backgroundColor: c.now }]}>
          <View style={[styles.nowLine, { backgroundColor: c.nowText }]} />
          <View style={[styles.nowButton, { backgroundColor: c.nowDone }]} />
        </View>
        <View style={[styles.card, { backgroundColor: c.row }]}>
          <View style={styles.cardRow}>
            <View style={[styles.cardLine, { backgroundColor: c.text }]} />
          </View>
          <View style={[styles.cardRow, { borderTopWidth: 1, borderTopColor: c.line }]}>
            <View style={[styles.cardLine, styles.cardLineShort, { backgroundColor: c.text }]} />
          </View>
        </View>
      </View>
      <View style={[styles.micRing, { borderColor: c.micRing }]}>
        <View style={[styles.mic, { backgroundColor: c.accent }]} />
      </View>
      <View style={[styles.footer, { backgroundColor: c.footer }]}>
        <View style={[styles.field, { backgroundColor: c.field }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: size.themeTile,
    height: size.themePreview,
    borderRadius: radius.chip,
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    paddingTop: space[10],
    paddingHorizontal: space[6],
    gap: space[4],
  },
  date: {
    width: 22,
    height: 3,
    borderRadius: radius.pill,
    opacity: 0.7,
  },
  title: {
    width: 36,
    height: 6,
    borderRadius: radius.pill,
    marginBottom: space[2],
  },
  now: {
    padding: space[6],
    gap: space[6],
    borderRadius: space[6],
  },
  nowLine: {
    width: '80%',
    height: 4,
    borderRadius: radius.pill,
  },
  nowButton: {
    width: 24,
    height: 7,
    borderRadius: 3,
  },
  card: {
    borderRadius: space[6],
    overflow: 'hidden',
  },
  cardRow: {
    height: 12,
    paddingHorizontal: space[6],
    justifyContent: 'center',
  },
  cardLine: {
    width: '70%',
    height: 3,
    borderRadius: radius.pill,
    opacity: 0.8,
  },
  cardLineShort: {
    width: '50%',
  },
  // 🎙 «в воздухе» справа над полем
  micRing: {
    position: 'absolute',
    right: space[6],
    bottom: 24,
    width: 18,
    height: 18,
    padding: 2,
    borderWidth: 1.5,
    borderRadius: radius.pill,
  },
  mic: {
    flex: 1,
    borderRadius: radius.pill,
  },
  footer: {
    height: 20,
    paddingHorizontal: space[6],
    justifyContent: 'center',
  },
  field: {
    height: 10,
    borderRadius: 5,
  },
});
