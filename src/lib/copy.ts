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
  },
} as const;
