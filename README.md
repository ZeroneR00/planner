# Планировщик дня

Мобильный планировщик на React Native (Expo): записать мысль за пару секунд, разобрать потом.

- Продукт, экраны и этапы — [docs/SPEC.md](docs/SPEC.md)
- Как устроен код и правила работы — [AGENTS.md](AGENTS.md)
- Журнал решений — [docs/DECISIONS.md](docs/DECISIONS.md)

## Запуск

```bash
npm install
npx expo start      # открыть «Джарвис» на Android-телефоне (та же Wi-Fi-сеть); Expo Go — клавиша s
```

«Джарвис» — своя сборка (development build) из облака Expo: в ней работает голос, которого нет в Expo Go. Код приходит с компьютера, поэтому пересобирать нужно только после нового нативного пакета:

```bash
npx eas-cli build -p android --profile development   # ссылка на APK — в конце сборки и на expo.dev
```

## Проверки

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm test            # Jest
```
