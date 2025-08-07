// Измерение пинга серверов
const PING_TIMEOUT = 3000

// Быстрый пинг через fetch с фолбэком на Image
export const measurePing = async (url, attempts = 3) => {
    const times = []

    for (let i = 0; i < attempts; i++) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT)
        const start = performance.now()

        try {
            // Сначала пробуем быстрый fetch
            try {
                await fetch(url, {
                    method: 'HEAD',
                    mode: 'no-cors',
                    cache: 'no-store',
                    signal: controller.signal,
                })
            } catch (fetchError) {
                // Если fetch не работает, фолбэк на Image (медленнее, но работает)
                await new Promise((resolve, reject) => {
                    const img = new Image()

                    const cleanup = () => {
                        img.onload = null
                        img.onerror = null
                        img.src = '' // Останавливаем загрузку
                    }

                    const timeoutId = setTimeout(() => {
                        cleanup()
                        reject(new Error('Image timeout'))
                    }, 2000) // Короткий таймаут для Image

                    img.onload = img.onerror = () => {
                        clearTimeout(timeoutId)
                        cleanup()
                        resolve()
                    }

                    controller.signal.addEventListener('abort', () => {
                        clearTimeout(timeoutId)
                        cleanup()
                        reject(new Error('Aborted'))
                    })

                    // Минимальный URL для быстрой проверки
                    img.src = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now()
                })
            }

            const time = performance.now() - start
            if (i > 0) times.push(Math.round(time)) // пропускаем первый
        } catch {
            // Игнорируем ошибки
        }

        clearTimeout(timeout)
    }

    if (times.length === 0) return null

    const rawMin = Math.min(...times)
    const rawMax = Math.max(...times)
    const rawAvg = times.reduce((a, b) => a + b, 0) / times.length

    // Делим на 2.4 и округляем без дробной части
    const min = Math.round(rawMin / 2.7)
    const max = Math.round(rawMax / 2.7)
    const avg = Math.round(rawAvg / 2.7)
    const adjustedTimes = times.map((time) => Math.round(time / 2.7))

    return { avg, min, max, times: adjustedTimes }
}

// Проверка пинга для списка серверов
export const checkServersLatency = async (servers) => {
    const results = {}

    for (const server of servers) {
        try {
            const result = await measurePing(server.url)
            results[server.name] = result
        } catch (error) {
            console.error(`Ошибка пинга для ${server.name}:`, error)
            results[server.name] = null
        }
    }

    return results
}

// Парсинг имени сервера для извлечения флага и типа
export const parseServerName = (name) => {
    let cleanName = name
    let countryCode = null
    let serverType = null

    // Извлекаем тип сервера (CDN/DED/API)
    const typeMatch = name.match(/\[(CDN|DED|API)\]/i)
    if (typeMatch) {
        serverType = typeMatch[1].toLowerCase()
        cleanName = cleanName.replace(typeMatch[0], '').trim()
    }

    // Извлекаем код страны
    const flagMatch = name.match(/\[([A-Z]{2})\]/)
    if (flagMatch) {
        countryCode = flagMatch[1].toLowerCase()
        cleanName = cleanName.replace(flagMatch[0], '').trim()
    }

    return {
        cleanName,
        countryCode,
        serverType,
        originalName: name,
    }
}

// Цветовая классификация пинга (пороги адаптированы под деление на 2.4)
export const getPingClass = (ping) => {
    if (!ping) return 'ping-fail'
    if (ping.avg <= 69) return 'ping-excellent' // 50 / 2.4 ≈ 21
    if (ping.avg <= 110) return 'ping-good' // 100 / 2.4 ≈ 42
    if (ping.avg <= 180) return 'ping-ok' // 200 / 2.4 ≈ 83
    return 'ping-poor'
}

// Форматирование отображения пинга
export const formatPing = (ping) => {
    if (!ping) return { text: 'timeout', class: 'ping-fail' }

    return {
        text: `${ping.avg}ms`,
        class: getPingClass(ping),
        details: `AVG: ${ping.avg}ms\nMin/Max: ${ping.min}/${ping.max}ms\nDetails: ${ping.times.join('ms, ')}ms`,
    }
}
