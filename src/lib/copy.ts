// Все тексты интерфейса — здесь. Переименование раздела или кнопки = правка одной строки.

// Формы названия раздела: что / куда / где. Переименование — правка этих трёх строк
const POCKET = 'Карман';
const POCKET_ACC = 'карман';
const POCKET_LOC = 'кармане';

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
  },
  pocket: {
    title: (n: number) => `${POCKET} · ${n}`,
    empty: `${POCKET} пуст — всё разобрано`,
    returned: 'вчера не отмечено', // иконка ↩ рисуется отдельно
    toToday: 'Сегодня',
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
    addedToPocket: `Лежит в ${POCKET_LOC}. Разберёшь, когда будет минута`,
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
    monthly: (day: number) => `каждый месяц, ${day}-го`,
    doneToday: 'на сегодня готово',
  },
  a11y: {
    ahead: (n: number) => `Впереди: ${n}`,
    check: (title: string) => `Готово: ${title}`,
    uncheck: (title: string) => `Вернуть: ${title}`,
    markDone: (title: string) => `Уже сделал: ${title}`,
    toToday: (title: string) => `На сегодня: ${title}`,
    remove: (title: string) => `Убрать: ${title}`,
    edit: (title: string) => `Изменить: ${title}`,
  },
} as const;
