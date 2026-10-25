// https://docs.expo.dev/guides/customizing-metro/
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-notifications 58.1 на Android при импорте требует модуль подписки на push-топики, которого
// нет в Expo Go, — приложение падает на старте. Push нам не нужен (напоминания локальные), поэтому
// берём заглушку того же модуля, которую пакет сам отдаёт iOS и вебу. Убрать, когда пакет исправят
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'android' &&
    moduleName === './TopicSubscriptionModule' &&
    context.originModulePath.includes(`${path.sep}expo-notifications${path.sep}`)
  ) {
    return {
      type: 'sourceFile',
      filePath: path.join(path.dirname(context.originModulePath), 'TopicSubscriptionModule.js'),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
