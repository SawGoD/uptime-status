// Переводы для проекта
export const MESSAGES = {
    en: {
        // Общие
        loading: 'Loading...',
        noData: 'No data',
        noDataDesc: 'Failed to load monitor information',
        open: 'Open',

        // Статусы
        statusWorking: 'Working',
        statusDown: 'Down',
        statusUnknown: 'Unknown',

        // Timeline и статистика
        availability: 'Availability',
        averageAvailability: 'Average availability:',
        outagesFor: 'Outages for {days} days:',
        noOutagesFor: 'For {days} days:',
        noOutages: 'No outages',
        outagesCount: '{count} ({duration})',
        daysAgo: '{days} days ago',
        today: 'Today',

        // Навигация
        support: 'Support',
        system: 'System',
        light: 'Light',
        dark: 'Dark',

        // Языки
        language: 'Language',
        english: 'English',
        russian: 'Русский',

        // Заголовки
        serverStatus: 'Server Status',

        // Футер
        footerText: 'Based on UptimeRobot API, check frequency 5 minutes',

        // Обновления
        updateAvailable: 'Update Available',
        updateDescription: 'A new version of the application is available. Update now to get the latest improvements.',
        updateNow: 'Update Now',
        later: 'Later',

        // Пинг
        pingStatus: 'Current delay',
    },
    ru: {
        // Общие
        loading: 'Загрузка...',
        noData: 'Нет данных',
        noDataDesc: 'Не удалось загрузить информацию о мониторах',
        open: 'Открыть',

        // Статусы
        statusWorking: 'Работает',
        statusDown: 'Недоступен',
        statusUnknown: 'Неизвестно',

        // Timeline и статистика
        availability: 'Доступность',
        averageAvailability: 'Средняя доступность:',
        outagesFor: 'Сбоев за {days} дней:',
        noOutagesFor: 'За {days} дней:',
        noOutages: 'Без сбоев',
        outagesCount: '{count} ({duration})',
        daysAgo: '{days} дней назад',
        today: 'Сегодня',

        // Навигация
        support: 'Поддержка',
        system: 'Системная',
        light: 'Светлая',
        dark: 'Темная',

        // Языки
        language: 'Язык',
        english: 'English',
        russian: 'Русский',

        // Заголовки
        serverStatus: 'Статус серверов',

        // Футер
        footerText: 'Сделано на основе API UptimeRobot, частота проверки 5 минут',

        // Обновления
        updateAvailable: 'Доступно обновление',
        updateDescription: 'Доступна новая версия приложения. Обновите сейчас, чтобы получить последние улучшения.',
        updateNow: 'Обновить сейчас',
        later: 'Позже',

        // Пинг
        pingStatus: 'Текущая задержка',
    },
}

// Локаль по умолчанию
export const DEFAULT_LOCALE = 'ru'

// Получить локаль пользователя
export const getUserLocale = () => {
    const savedLocale = localStorage.getItem('locale')
    if (savedLocale && MESSAGES[savedLocale]) {
        return savedLocale
    }

    const browserLocale = (navigator.language || navigator.userLanguage).split('-')[0]
    return MESSAGES[browserLocale] ? browserLocale : DEFAULT_LOCALE
}

// Сохранить локаль
export const setUserLocale = (locale) => {
    if (MESSAGES[locale]) {
        localStorage.setItem('locale', locale)
        return locale
    }
    return DEFAULT_LOCALE
}

// Получить перевод с заменой параметров
export const t = (key, params = {}, locale = getUserLocale()) => {
    const messages = MESSAGES[locale] || MESSAGES[DEFAULT_LOCALE]
    let translation = messages[key] || key

    // Заменяем параметры в переводе
    Object.keys(params).forEach((param) => {
        translation = translation.replace(`{${param}}`, params[param])
    })

    return translation
}
