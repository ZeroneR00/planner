import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { SettingRow } from '@/components/setting-row';
import { usePlanner } from '@/hooks/use-planner';
import { openReminderSound } from '@/hooks/use-reminders';
import { hush, openSpeechSettings, say } from '@/hooks/use-reply';
import { copy } from '@/lib/copy';
import { colors, pressedOpacity, space, text, touch } from '@/theme';

export default function SettingsScreen() {
  const { settings, changeSettings } = usePlanner();
  const toggleReplies = () => {
    const on = !settings.voiceReplies;
    changeSettings({ voiceReplies: on });
    // Включили — сразу слышно, что голос работает
    if (on) say(copy.reply.sample);
    else hush();
  };
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={copy.settings.back}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Icon name="back" size={22} color={colors.text} strokeWidth={2.2} />
        </Pressable>
        <Text style={text.screenTitle}>{copy.settings.title}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={text.section}>{copy.settings.voice}</Text>
          <SettingRow
            title={copy.settings.replies}
            note={copy.settings.repliesNote}
            value={settings.voiceReplies}
            onPress={toggleReplies}
          />
          <SettingRow title={copy.settings.speechVoice} note={copy.settings.inPhone} onPress={openSpeechSettings} />
        </View>
        <View style={styles.section}>
          <Text style={text.section}>{copy.settings.reminders}</Text>
          <SettingRow
            title={copy.settings.reminderSound}
            note={copy.settings.inPhone}
            onPress={() => void openReminderSound()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: space[18],
    paddingRight: space[16],
    paddingBottom: space[12],
    paddingLeft: space[6],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  back: {
    width: touch,
    height: touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: space[4],
    paddingHorizontal: space[16],
    paddingBottom: space[20],
    gap: space[24],
  },
  section: {
    gap: space[8],
  },
  pressed: {
    opacity: pressedOpacity,
  },
});
