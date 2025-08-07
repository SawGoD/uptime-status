import axios from 'axios'
import dayjs from 'dayjs'
import { formatNumber } from './helper'

// Кеш для результатов API (5 минут) - общий для всех API ключей
const CACHE_DURATION = 5 * 60 * 1000 // 5 минут обычно
const CACHE_DURATION_RATE_LIMITED = 15 * 60 * 1000 // 15 минут при rate limiting

// Хранилище для активных запросов (чтобы избежать дублирования)
const activeRequests = new Map()

// Функции для работы с localStorage кешем
const getCacheData = (cacheKey) => {
    try {
        const cacheItem = localStorage.getItem(`uptimerobot_cache_${cacheKey}`)
        if (cacheItem) {
            const parsed = JSON.parse(cacheItem)
            // Восстанавливаем dayjs объекты из кеша
            const restoredData = parsed.data.map((monitor) => ({
                ...monitor,
                daily: monitor.daily.map((day) => ({
                    ...day,
                    date: dayjs(day.date), // Восстанавливаем dayjs объект
                })),
            }))
            return {
                data: restoredData,
                timestamp: parsed.timestamp,
                isRateLimited: parsed.isRateLimited || false,
            }
        }
    } catch (error) {
        console.warn('Ошибка чтения кеша:', error)
    }
    return null
}

const setCacheData = (cacheKey, data, isRateLimited = false) => {
    try {
        // Преобразуем dayjs объекты в строки для сериализации
        const serializedData = data.map((monitor) => ({
            ...monitor,
            daily: monitor.daily.map((day) => ({
                ...day,
                date: day.date.toISOString(), // Преобразуем dayjs в строку
            })),
        }))

        const cacheItem = {
            data: serializedData,
            timestamp: Date.now(),
            isRateLimited,
        }
        localStorage.setItem(`uptimerobot_cache_${cacheKey}`, JSON.stringify(cacheItem))
    } catch (error) {
        console.warn('Ошибка сохранения кеша:', error)
    }
}

const isCacheValid = (cacheData) => {
    if (!cacheData) return false

    const now = Date.now()
    const cacheDuration = cacheData.isRateLimited ? CACHE_DURATION_RATE_LIMITED : CACHE_DURATION
    const isValid = now - cacheData.timestamp < cacheDuration

    if (isValid) {
        const ageMinutes = Math.round((now - cacheData.timestamp) / 1000 / 60)
        console.log(
            `📦 Используем кешированные данные (возраст: ${ageMinutes} мин${cacheData.isRateLimited ? ', режим rate-limit защиты' : ''})`
        )
    }

    return isValid
}

export async function GetMonitors(apikey, days) {
    // Создаем ключ кеша с учетом API ключа (последние 8 символов для уникальности)
    const apiKeyHash = apikey.slice(-8)
    const cacheKey = `${apiKeyHash}_${days}_days`

    // Проверяем кеш
    const cachedData = getCacheData(cacheKey)
    if (isCacheValid(cachedData)) {
        return cachedData.data
    }

    // Проверяем, есть ли уже активный запрос с тем же ключом кеша
    if (activeRequests.has(cacheKey)) {
        console.log('⏳ Ожидаем завершения активного запроса...')
        return await activeRequests.get(cacheKey)
    }

    console.log('🔄 Кеш устарел или отсутствует, запрашиваем новые данные...')

    // Создаем промис для этого запроса
    const requestPromise = makeApiRequest(apikey, days, cacheKey)
    activeRequests.set(cacheKey, requestPromise)

    try {
        const result = await requestPromise
        return result
    } finally {
        // Удаляем запрос из активных
        activeRequests.delete(cacheKey)
    }
}

async function makeApiRequest(apikey, days, cacheKey) {
    let isRateLimited = false

    const dates = []
    const today = dayjs(new Date().setHours(0, 0, 0, 0))
    for (let d = 0; d < days; d++) {
        dates.push(today.subtract(d, 'day'))
    }

    const ranges = dates.map((date) => `${date.unix()}_${date.add(1, 'day').unix()}`)
    const start = dates[dates.length - 1].unix()
    const end = dates[0].add(1, 'day').unix()
    ranges.push(`${start}_${end}`)

    const postdata = {
        api_key: apikey,
        format: 'json',
        logs: 1,
        log_types: '1-2',
        logs_start_date: start,
        logs_end_date: end,
        custom_uptime_ranges: ranges.join('-'),
    }

    const formData = new URLSearchParams()
    Object.keys(postdata).forEach((key) => {
        formData.append(key, postdata[key])
    })

    let response = null
    let lastError = null

    // Сначала пробуем прямое подключение к API
    try {
        console.log('🚀 Пробуем ПРЯМОЕ подключение к UptimeRobot API...')
        console.log('📡 URL: https://api.uptimerobot.com/v2/getMonitors')
        console.log('🔧 Метод: POST')

        // Маскируем API ключ в логах
        const maskedData = formData.toString().replace(/api_key=[^&]+/g, 'api_key=***masked***')
        console.log('📤 Данные:', maskedData.substring(0, 120) + '...')

        response = await axios({
            method: 'POST',
            url: 'https://api.uptimerobot.com/v2/getMonitors',
            data: formData.toString(),
            timeout: 15000,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })

        console.log('✅ ПРЯМОЕ: Подключение успешно!')
        console.log('📦 ПРЯМОЕ: Ответ получен, проверяем...')

        // Проверяем валидность ответа
        if (response.data && response.data.stat === 'ok') {
            console.log('🎉 ПРЯМОЕ: Валидные данные получены! Используем прямое подключение.')
            console.log('📊 ПРЯМОЕ: Мониторов найдено:', response.data.monitors?.length || 0)
        } else {
            console.warn('⚠️ ПРЯМОЕ: Невалидные данные:', response.data)
            response = null
        }
    } catch (error) {
        console.error('❌ ПРЯМОЕ: Ошибка подключения')
        console.error('🔴 ПРЯМОЕ:', error.message)
        if (error.response) {
            console.error('📄 ПРЯМОЕ: Статус:', error.response.status)
            console.error('📄 ПРЯМОЕ: Ответ:', error.response.data)

            // Устанавливаем флаг rate limiting при 429 ошибке
            if (error.response.status === 429) {
                isRateLimited = true
                console.log('⚠️ Обнаружен rate limiting - включаем расширенное кеширование')
            }
        }

        // Если это CORS ошибка или rate limit (429), пробуем прокси
        if (error.message.includes('CORS') || error.message.includes('Network Error') || error.response?.status === 429) {
            console.log('🔄 Пробуем CORS прокси...')

            // Список CORS прокси для fallback
            const corsProxies = [
                {
                    name: 'AllOrigins',
                    url:
                        'https://api.allorigins.win/raw?url=' +
                        encodeURIComponent('https://api.uptimerobot.com/v2/getMonitors?' + formData.toString()),
                    method: 'GET',
                    data: null,
                    headers: {},
                },
                {
                    name: 'JSONP.io',
                    url:
                        'https://jsonp.afeld.me/?url=' +
                        encodeURIComponent('https://api.uptimerobot.com/v2/getMonitors?' + formData.toString()),
                    method: 'GET',
                    data: null,
                    headers: {},
                },
                {
                    name: 'ProxyHerd',
                    url:
                        'https://api.proxyherd.com/v1/?url=' +
                        encodeURIComponent('https://api.uptimerobot.com/v2/getMonitors?' + formData.toString()),
                    method: 'GET',
                    data: null,
                    headers: {},
                },
                {
                    name: 'CorsProxy.org',
                    url: 'https://corsproxy.org/?' + encodeURIComponent('https://api.uptimerobot.com/v2/getMonitors?' + formData.toString()),
                    method: 'GET',
                    data: null,
                    headers: {},
                },
                {
                    name: 'CORS.SH',
                    url: 'https://proxy.cors.sh/https://api.uptimerobot.com/v2/getMonitors',
                    method: 'POST',
                    data: formData.toString(),
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                },
            ]

            // Пробуем каждый прокси по очереди
            for (let i = 0; i < corsProxies.length; i++) {
                const proxy = corsProxies[i]

                try {
                    console.log(`🔄 [${i + 1}/${corsProxies.length}] Пробуем прокси ${proxy.name}`)
                    console.log(`📡 URL: ${proxy.url}`)
                    console.log(`🔧 Метод: ${proxy.method}`)
                    console.log(`📤 Данные:`, proxy.data ? 'есть (с замаскированным API ключом)' : 'нет')

                    response = await axios({
                        method: proxy.method,
                        url: proxy.url,
                        data: proxy.data,
                        timeout: 15000,
                        headers: proxy.headers,
                    })

                    console.log(`✅ ${proxy.name}: Подключение успешно`)
                    console.log(`📦 ${proxy.name}: Ответ получен, проверяем...`)

                    // Проверяем что получили валидный ответ от UptimeRobot
                    if (response.data && response.data.stat === 'ok') {
                        console.log(`🎉 ${proxy.name}: Валидные данные получены! Используем этот прокси.`)
                        console.log(`📊 ${proxy.name}: Мониторов найдено: ${response.data.monitors?.length || 0}`)
                        break
                    } else {
                        console.warn(`⚠️ ${proxy.name}: Невалидные данные:`, response.data)
                        response = null
                    }
                } catch (proxyError) {
                    console.error(`❌ ${proxy.name}: Ошибка подключения`)
                    console.error(`🔴 ${proxy.name}: ${proxyError.message}`)
                    if (proxyError.response) {
                        console.error(`📄 ${proxy.name}: Статус: ${proxyError.response.status}`)
                        console.error(`📄 ${proxy.name}: Ответ:`, proxyError.response.data)
                    }
                    lastError = proxyError
                    response = null

                    // Задержка перед следующим прокси (1 секунда)
                    if (i < corsProxies.length - 1) {
                        console.log(`⏳ Ждем 1 секунду перед следующим прокси...`)
                        await new Promise((resolve) => setTimeout(resolve, 1000))
                    }
                }
            }
        } else {
            lastError = error
        }
    }

    if (!response) {
        throw new Error(`Не удалось подключиться к UptimeRobot API. Последняя ошибка: ${lastError?.message || 'Неизвестная ошибка'}`)
    }
    if (response.data.stat !== 'ok') throw response.data.error

    // Обрабатываем данные
    const processedData = response.data.monitors.map((monitor) => {
        const ranges = monitor.custom_uptime_ranges.split('-')
        const average = formatNumber(ranges.pop())
        const daily = []
        const map = []
        dates.forEach((date, index) => {
            map[date.format('YYYYMMDD')] = index
            daily[index] = {
                date: date,
                uptime: formatNumber(ranges[index]),
                down: { times: 0, duration: 0 },
            }
        })

        const total = monitor.logs.reduce(
            (total, log) => {
                if (log.type === 1) {
                    const date = dayjs.unix(log.datetime).format('YYYYMMDD')
                    total.duration += log.duration
                    total.times += 1
                    daily[map[date]].down.duration += log.duration
                    daily[map[date]].down.times += 1
                }
                return total
            },
            { times: 0, duration: 0 }
        )

        const result = {
            id: monitor.id,
            name: monitor.friendly_name,
            url: monitor.url,
            average: average,
            daily: daily,
            total: total,
            status: 'unknow',
        }

        if (monitor.status === 2) result.status = 'ok'
        if (monitor.status === 9) result.status = 'down'
        return result
    })

    // Сохраняем в кеш
    setCacheData(cacheKey, processedData, isRateLimited)

    const cacheMinutes = (isRateLimited ? CACHE_DURATION_RATE_LIMITED : CACHE_DURATION) / 1000 / 60
    console.log(`💾 Данные сохранены в кеш на ${cacheMinutes} минут${isRateLimited ? ' (расширенное время из-за rate limiting)' : ''}`)

    return processedData
}
