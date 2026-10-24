import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { copy } from '@/lib/copy';
import { colors, pressedOpacity, space, text, touch } from '@/theme';

// Пока заглушка: шапка и пустой экран
export default function AheadScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={copy.ahead.back}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Icon name="back" size={22} color={colors.text} strokeWidth={2.2} />
        </Pressable>
        <Text style={text.screenTitle}>{copy.ahead.title}</Text>
      </View>
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
  pressed: {
    opacity: pressedOpacity,
  },
});
