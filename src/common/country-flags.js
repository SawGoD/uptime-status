// Маппинг префиксов серверов на коды стран
const countryPrefixes = {
    'DE-': 'DE', // Германия
    'SE-': 'SE', // Швеция
    'FR-': 'FR', // Франция
    'LT-': 'LT', // Литва
    'LV-': 'LV', // Латвия
    'RU-': 'RU', // Россия
    'FI-': 'FI', // Финляндия
}

// Маппинг кодов стран на emoji флаги
const countryFlags = {
    DE: '🇩🇪', // Германия
    SE: '🇸🇪', // Швеция
    FR: '🇫🇷', // Франция
    LT: '🇱🇹', // Литва
    LV: '🇱🇻', // Латвия
    RU: '🇷🇺', // Россия
    FI: '🇫🇮', // Финляндия
}

// Полные названия стран
const countryNames = {
    DE: 'Германия',
    SE: 'Швеция',
    FR: 'Франция',
    LT: 'Литва',
    LV: 'Латвия',
    RU: 'Россия',
    FI: 'Финляндия',
}

/**
 * Определяет код страны по названию сервера
 * @param {string} serverName - название сервера
 * @returns {string|null} - код страны или null если не найден
 */
export const getCountryCodeFromServerName = (serverName) => {
    if (!serverName) return null

    for (const [prefix, countryCode] of Object.entries(countryPrefixes)) {
        if (serverName.startsWith(prefix)) {
            return countryCode
        }
    }

    return null
}

/**
 * Получает emoji флаг по коду страны
 * @param {string} countryCode - код страны (например 'DE')
 * @returns {string|null} - emoji флаг или null если не найден
 */
export const getFlagEmoji = (countryCode) => {
    return countryFlags[countryCode] || null
}

/**
 * Получает название страны по коду
 * @param {string} countryCode - код страны
 * @returns {string|null} - название страны или null если не найдено
 */
export const getCountryName = (countryCode) => {
    return countryNames[countryCode] || null
}

/**
 * Удаляет префикс страны из названия сервера
 * @param {string} serverName - название сервера
 * @returns {string} - название без префикса
 */
export const removeCountryPrefix = (serverName) => {
    if (!serverName) return serverName

    for (const prefix of Object.keys(countryPrefixes)) {
        if (serverName.startsWith(prefix)) {
            return serverName.substring(prefix.length)
        }
    }

    return serverName
}
