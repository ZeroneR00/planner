import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { ThemeName } from '@/lib/theme-choice';
import { circle, size, space, themes } from '@/theme';

/** Мини-«Сегодня» в цветах и деталях темы name (а не той, что на экране): картинка темы в «Настройках». */
export function ThemePreview({ name }: { name: ThemeName }) {
  const { radius: screenRadius } = useTheme();
  const { colors: c, radius, details } = themes[name];
  return (
    // Скругление — как у рамки выбора вокруг, то есть по теме на экране
    <View style={[styles.screen, { borderRadius: screenRadius.chip, backgroundColor: c.bg }]}>
      <View style={styles.body}>
        <View style={[styles.date, { backgroundColor: c.textSecondary }]} />
        <View style={[styles.title, { backgroundColor: c.text }]} />
        <View
          style={[
            styles.now,
            {
              borderRadius: Math.round(radius.card / 4),
              backgroundColor: c.now,
            },
            details.framed && { borderWidth: 1, borderColor: c.cardBorder },
            details.sticker !== null && styles.tilted,
          ]}
        >
          <View style={[styles.nowLine, { backgroundColor: c.nowText }]} />
          <View style={[styles.nowButton, { backgroundColor: c.nowDone }]} />
        </View>
        <Pocket name={name} />
      </View>
      {details.footer === 'voice' ? (
        // «Голос»: внизу «Аа · 🎙 · 📷», поля нет
        <View style={[styles.footer, styles.voiceFooter, { backgroundColor: c.footer }]}>
          <View style={[styles.side, { borderColor: c.lineStrong }]} />
          <View style={styles.voiceMic}>
            <View style={[styles.wave, styles.waveNear, { borderColor: c.accent }]} />
            <View style={[styles.wave, styles.waveFar, { borderColor: c.accent }]} />
            <View style={[styles.mic, { backgroundColor: c.accent }]} />
          </View>
          <View style={[styles.side, { borderColor: c.lineStrong }]} />
        </View>
      ) : (
        <>
          <View style={styles.floatingMic}>
            <View style={[styles.wave, styles.waveNear, { borderColor: c.accent }]} />
            <View style={[styles.wave, styles.waveFar, { borderColor: c.accent }]} />
            <View style={[styles.mic, { backgroundColor: c.accent }]} />
          </View>
          <View style={[styles.footer, { backgroundColor: c.footer }]}>
            <View
              style={[
                styles.field,
                {
                  borderRadius: Math.min(radius.field, 5),
                  backgroundColor: c.field,
                },
              ]}
            />
          </View>
        </>
      )}
    </View>
  );
}

// Стикеры: карточка, строки через линию или бумажки рядом
function Pocket({ name }: { name: ThemeName }) {
  const { colors: c, details } = themes[name];
  if (details.pocket === 'notes') {
    return (
      <View style={styles.notes}>
        {(details.notes ?? []).slice(0, 2).map((note) => (
          <View
            key={note.color}
            // Наклон вдвое больше, чем на экране: на крошечной картинке иначе не заметен
            style={[
              styles.note,
              {
                backgroundColor: note.color,
                transform: [{ rotate: doubled(note.tilt) }],
              },
            ]}
          >
            <View style={[styles.noteLine, { backgroundColor: c.text }]} />
          </View>
        ))}
      </View>
    );
  }
  const lines = details.pocket === 'lines';
  return (
    <View style={lines ? null : [styles.card, { backgroundColor: c.row }]}>
      <View style={[styles.cardRow, lines && { borderTopWidth: 1, borderTopColor: c.line }]}>
        <View style={[styles.cardLine, { backgroundColor: c.text }]} />
      </View>
      <View
        style={[
          styles.cardRow,
          { borderTopWidth: 1, borderTopColor: c.line },
          lines && { borderBottomWidth: 1, borderBottomColor: c.line },
        ]}
      >
        <View style={[styles.cardLine, styles.cardLineShort, { backgroundColor: c.text }]} />
      </View>
    </View>
  );
}

// '1.2deg' → '2.4deg'
function doubled(tilt: string): string {
  return `${parseFloat(tilt) * 2}deg`;
}

const MIC = { right: space[6], bottom: 24, size: 18 } as const;
const VOICE_MIC = 14;

const styles = StyleSheet.create({
  screen: {
    width: size.themeTile,
    height: size.themePreview,
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
    borderRadius: circle,
    opacity: 0.7,
  },
  title: {
    width: 36,
    height: 6,
    borderRadius: circle,
    marginBottom: space[2],
  },
  now: {
    padding: space[6],
    gap: space[6],
  },
  tilted: {
    transform: [{ rotate: '-2deg' }],
  },
  nowLine: {
    width: '80%',
    height: 4,
    borderRadius: circle,
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
  notes: {
    flexDirection: 'row',
    gap: space[4],
    paddingTop: space[2],
  },
  note: {
    width: 26,
    height: 22,
    padding: 4,
    borderRadius: 2,
  },
  noteLine: {
    width: '80%',
    height: 3,
    borderRadius: circle,
    opacity: 0.8,
  },
  cardRow: {
    height: 12,
    paddingHorizontal: space[6],
    justifyContent: 'center',
  },
  cardLine: {
    width: '70%',
    height: 3,
    borderRadius: circle,
    opacity: 0.8,
  },
  cardLineShort: {
    width: '50%',
  },
  // 🎙 «в воздухе» справа над полем, кольца — как у 🎙 «Голоса»
  floatingMic: {
    position: 'absolute',
    right: MIC.right,
    bottom: MIC.bottom,
    width: MIC.size,
    height: MIC.size,
  },
  mic: {
    flex: 1,
    borderRadius: circle,
  },
  // «Голос»: 🎙 по центру подвала, по бокам «Аа» и 📷
  voiceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderRadius: circle,
  },
  voiceMic: {
    width: VOICE_MIC,
    height: VOICE_MIC,
  },
  // Два кольца вокруг 🎙 любого размера — дальнее бледнее
  wave: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: circle,
  },
  waveNear: {
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    opacity: 0.45,
  },
  waveFar: {
    top: -9,
    left: -9,
    right: -9,
    bottom: -9,
    opacity: 0.2,
  },
  footer: {
    height: 20,
    paddingHorizontal: space[6],
    justifyContent: 'center',
  },
  field: {
    height: 10,
  },
});
