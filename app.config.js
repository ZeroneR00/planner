// Сборка для разработки — отдельное приложение «Джарвис Dev» рядом с APK: свои задачи, свой пакет
const IS_DEV = process.env.APP_VARIANT === 'development';

module.exports = ({ config }) =>
  IS_DEV
    ? {
        ...config,
        name: 'Джарвис Dev',
        scheme: 'planner-dev',
        android: { ...config.android, package: 'com.zeroner00.planner.dev' },
      }
    : config;
