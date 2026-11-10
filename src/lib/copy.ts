// Все тексты интерфейса — здесь. Переименование раздела или кнопки = правка одной строки.

// Формы названия раздела: что / куда. Переименование — правка этих двух строк
const POCKET = 'Стикеры';
const POCKET_ACC = 'стикеры';

// «1 день», «3 дня», «5 дней»; 11–14 — всегда many
function plural(n: number, one: string, few: string, many: string): string {
  const tens = n % 100;
  const units = n % 10;
  if (tens >= 11 && tens <= 14) return many;
  if (units === 1) return one;
  if (units >= 2 && units <= 4) return few;
  return many;
}

export const copy = {
  today: {
    title: 'Сегодня',
    empty: 'На сегодня всё. Можно выдохнуть.',
    doneCount: (n: number) => `сделано ${n}`,
    now: 'Сейчас',
    done: 'Сделано',
    later: 'Позже',
    rest: 'Дальше сегодня',
  },
  ahead: {
    title: 'Впереди',
    back: 'Назад к «Сегодня»',
    empty: 'Пока ничего не запланировано',
    repeating: 'Повторяется',
    stop: 'Остановить',
    next: (rule: string, day: string) => `${rule} · следующий — ${day}`,
  },
  pocket: {
    title: (n: number) => `${POCKET} · ${n}`,
    empty: 'Здесь пусто — всё разобрано',
    returned: 'вчера не отмечено', // иконка ↩ рисуется отдельно
    when: 'Когда?',
    editHint: 'тапни текст, чтобы изменить',
  },
  composer: {
    placeholder: 'Запиши мысль — разберёшь потом',
    inputLabel: 'Записать мысль',
    send: 'Добавить',
    chipPocket: `В ${POCKET_ACC}`,
    chipToday: 'Сегодня',
    chipTomorrow: 'Завтра',
    calendar: 'Дата',
    toPocket: `Упадёт в ${POCKET_ACC}, разберёшь потом`,
    fromText: 'понял из текста',
    addedToPocket: `Добавлено в ${POCKET_ACC}. Разберёшь, когда будет минута`,
    addedToday: 'Добавлено на сегодня',
    scheduled: (day: string) => `Запланировано: ${day}`,
    addedRepeat: (rule: string, from: string) => `${rule}, начиная с ${from}`,
    repeat: 'Повторять',
    repeatOn: (label: string) => `Повтор: ${label}`,
    repeatOnce: 'Один раз',
    repeatDaily: 'Каждый день',
    repeatWeekdays: 'По будням',
    repeatWeekly: (plural: string) => `Каждую неделю · ${plural}`,
    repeatMonthly: (day: number) => `Каждый месяц · ${day}-го`,
    repeatYearly: (day: string) => `Каждый год · ${day}`,
    time: 'Напомнить',
    timeOn: (time: string) => `Напомнить в ${time}`,
    noTime: 'Без времени',
    morning: 'Утром',
    afternoon: 'Днём',
    evening: 'Вечером',
    hourLabel: (hour: number) => `${hour} ч`,
    minuteLabel: (minute: number) => `${minute} мин`,
    prevMonth: 'Предыдущий месяц',
    nextMonth: 'Следующий месяц',
    editTitle: 'Правка',
    editRuleTitle: 'Правка повтора',
    cancel: 'Отмена',
    save: 'Сохранить изменения',
    editInputLabel: 'Текст задачи',
    editToPocket: `в ${POCKET_ACC}`,
    forAllRepeats: 'для всех повторов',
    saved: 'Изменено',
    savedRule: 'Изменено для всех повторов',
    repeatStopped: 'Больше не повторяется',
    remindersOff: 'уведомления выключены',
  },
  photo: {
    untitled: 'Фото', // задача-фото без подписи
    take: 'Сфотографировать',
    shoot: 'Снять',
    gallery: 'Выбрать из галереи',
    close: 'Закрыть',
    open: 'Открыть фото',
    noAccess: 'Нет доступа к камере',
    settings: 'Разрешить в настройках',
    saveFailed: 'Не получилось сохранить фото',
  },
  voice: {
    start: 'Надиктовать голосом',
    stop: 'Закончить диктовку',
    listening: 'Слушаю… Тап по экрану — закончить',
    notHeard: 'Не расслышал — скажи ещё раз',
    noAccess: 'Нет доступа к микрофону',
    offline: 'Без интернета голос не распознался',
    failed: 'Не получилось распознать голос',
  },
  // Ответы голосом: синтезатор читает текст, поэтому без сокращений
  reply: {
    openers: ['Принял', 'Понял', 'Будет сделано, сэр', 'Записал', 'Есть', 'Готово, сэр'],
    pocket: `В ${POCKET_ACC}`,
    today: 'На сегодня',
    todayAt: (time: string) => `Сегодня в ${time}`,
    tomorrow: 'Завтра',
    dayAfter: 'Послезавтра',
    at: (time: string) => `в ${time}`,
    // Индекс — как Date.getDay(): 0 = вс
    weekday: ['В воскресенье', 'В понедельник', 'Во вторник', 'В среду', 'В четверг', 'В пятницу', 'В субботу'],
    weekly: [
      'каждое воскресенье', 'каждый понедельник', 'каждый вторник', 'каждую среду',
      'каждый четверг', 'каждую пятницу', 'каждую субботу',
    ],
    weeklyDays: ['воскресеньям', 'понедельникам', 'вторникам', 'средам', 'четвергам', 'пятницам', 'субботам'],
    weeklyMany: (first: string, last: string) => `по ${first} и ${last}`,
    remindersOff: 'Уведомления выключены',
    noTitle: 'Не понял, что записать',
    sample: 'Принял. Буду отвечать голосом',
    notHeard: 'Не расслышал, повтори',
    noAccess: 'Нет доступа к микрофону',
    offline: 'Без интернета не разобрал',
    failed: 'Не получилось распознать',
  },
  settings: {
    title: 'Настройки',
    back: 'Назад',
    voice: 'Голос', // раздел
    replies: 'Отвечать голосом',
    repliesNote: 'Когда надиктовал: «Принял. Завтра в 9»',
    speechVoice: 'Голос и скорость',
    inPhone: 'в настройках телефона',
    reminders: 'Напоминания', // раздел
    reminderSound: 'Звук напоминаний',
  },
  reminders: {
    channel: 'Напоминания', // имя канала в настройках уведомлений Android
    // Кнопки в уведомлении
    snoozeShort: '+15 мин',
    snoozeLong: '+1 час',
    done: 'Сделано',
  },
  // Индекс дня недели: 0 = вс, как Date.getDay()
  dates: {
    today: 'сегодня',
    tomorrow: 'завтра',
    weekdayShort: ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
    weekdayFull: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'],
    monthGenitive: [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
    ],
    monthShort: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
    monthName: [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
    ],
  },
  repeat: {
    daily: 'каждый день',
    weekdays: 'по будням',
    weekly: ['каждое вс', 'каждый пн', 'каждый вт', 'каждую ср', 'каждый чт', 'каждую пт', 'каждую сб'],
    weeklyPlural: [
      'по воскресеньям', 'по понедельникам', 'по вторникам', 'по средам',
      'по четвергам', 'по пятницам', 'по субботам',
    ],
    weeklyMany: (first: string, last: string) => `по ${first} и ${last}`,
    monthly: (day: number) => `каждый месяц, ${day}-го`,
    yearly: (day: string) => `каждый год, ${day}`,
    everyOtherDay: 'через день',
    everyDays: (n: number) => `${plural(n, 'каждый', 'каждые', 'каждые')} ${n} ${plural(n, 'день', 'дня', 'дней')}`,
    everyWeeks: (n: number) => `раз в ${n} ${plural(n, 'неделю', 'недели', 'недель')}`,
    doneToday: 'на сегодня готово',
  },
  undo: {
    removed: (title: string) => `Убрано: ${title}`,
    done: (title: string) => `Сделано: ${title}`,
    moved: (day: string, title: string) => `На ${day}: ${title}`,
    stopped: (title: string) => `Повтор остановлен: ${title}`,
    back: 'Вернуть',
    a11y: (text: string) => `${text}. Вернуть`,
  },
  daySheet: {
    title: 'Когда?',
    today: 'Сегодня',
    tomorrow: 'Завтра',
    pickDate: 'Выбрать дату…',
  },
  a11y: {
    ahead: (n: number) => `Впереди: ${n}`,
    check: (title: string) => `Готово: ${title}`,
    uncheck: (title: string) => `Вернуть: ${title}`,
    markDone: (title: string) => `Уже сделал: ${title}`,
    when: (title: string) => `Когда: ${title}`,
    remove: (title: string) => `Убрать: ${title}`,
    edit: (title: string) => `Изменить: ${title}`,
    stop: (title: string) => `Остановить повтор: ${title}`,
    settings: 'Настройки',
  },
} as const;
