import { useEffect, useRef, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import { getCountryCodeFromServerName, getCountryName } from '../common/country-flags'
import { formatDuration, formatNumber } from '../common/helper'
import { formatPing, measurePing } from '../common/ping'
import { GetMonitors } from '../common/uptimerobot'
import { useLanguage } from '../contexts/LanguageContext'
import Link from './link'

const UptimeRobot = ({ apikey, pingUrl }) => {
    const { t } = useLanguage()

    const status = {
        ok: t('statusWorking'),
        down: t('statusDown'),
        unknow: t('statusUnknown'),
    }

    const { CountDays, ShowLink } = window.Config
    const [monitors, setMonitors] = useState(null)
    const [loading, setLoading] = useState(true)
    const [pingResult, setPingResult] = useState(null)
    const [pingLoading, setPingLoading] = useState(false)
    const pingIntervalRef = useRef(null)

    // Функция для обновления пинга
    const updatePing = async () => {
        if (!pingUrl || !window.Config?.PingSettings?.enabled) return

        setPingLoading(true)
        try {
            const result = await measurePing(pingUrl, window.Config.PingSettings.attempts || 3)
            setPingResult(result)
        } catch (error) {
            console.error('Ошибка измерения пинга:', error)
            setPingResult(null)
        } finally {
            setPingLoading(false)
        }
    }

    useEffect(() => {
        // Debouncing - задержка 500мс перед запросом
        const timeoutId = setTimeout(() => {
            setLoading(true)
            GetMonitors(apikey, CountDays)
                .then(setMonitors)
                .catch(console.error)
                .finally(() => setLoading(false))
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [apikey, CountDays])

    // Эффект для пинга
    useEffect(() => {
        if (pingUrl && window.Config?.PingSettings?.enabled) {
            // Сразу измеряем пинг
            updatePing()

            // Устанавливаем интервал
            const interval = window.Config.PingSettings.interval || 15000
            pingIntervalRef.current = setInterval(updatePing, interval)
        }

        return () => {
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current)
            }
        }
    }, [pingUrl])

    if (loading) {
        return (
            <div className="my-block-big">
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                    <div className="spinner-border my-text-primary" role="status">
                        <span className="visually-hidden">{t('loading')}</span>
                    </div>
                </div>
            </div>
        )
    }

    if (!monitors || monitors.length === 0) {
        return (
            <div className="my-block-big text-center">
                <h5 className="my-text-heading">{t('noData')}</h5>
                <p className="my-text-content">{t('noDataDesc')}</p>
            </div>
        )
    }

    return monitors.map((site) => {
        // Определяем флаг для отображения
        const countryCode = getCountryCodeFromServerName(site.name)
        const countryName = getCountryName(countryCode)

        // Получаем URL изображения флага
        const flagUrl = countryCode ? `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png` : null

        return (
            <div key={site.id} className="my-block-big mb-4">
                <div className="d-flex flex-wrap align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-2">
                        <div className={`status-indicator status-${site.status}`} title={status[site.status]}></div>

                        {/* Отображаем флаг страны если есть */}
                        {flagUrl && (
                            <img
                                src={flagUrl}
                                alt={`Флаг ${countryName}`}
                                title={countryName}
                                className="country-flag"
                                width="24"
                                height="18"
                            />
                        )}

                        <h5 className="my-text-heading fw-semibold mb-0" dangerouslySetInnerHTML={{ __html: site.name }} />
                        <span className={`badge status-badge-${site.status}`}>{status[site.status]}</span>
                    </div>
                    {ShowLink && <Link className="btn btn-sm my-btn-outline" to={site.url} text={t('open')} />}
                </div>

                <div className="timeline-container mb-3">
                    <div className="timeline">
                        {(() => {
                            // Создаем точки для SVG линии-графика
                            const svgPoints = site.daily
                                .slice()
                                .reverse()
                                .map((data, index) => {
                                    let yPercent = 50 // По умолчанию по центру
                                    if (data.uptime >= 100) {
                                        yPercent = 35 // Выше центра для OK
                                    } else if (data.uptime <= 0 && data.down.times === 0) {
                                        yPercent = 50 // По центру для нет данных
                                    } else {
                                        yPercent = 65 // Ниже центра для DOWN
                                    }
                                    const xPercent = (index / (site.daily.length - 1)) * 100
                                    return {
                                        x: xPercent,
                                        y: yPercent,
                                        status: data.uptime >= 100 ? 'ok' : data.uptime <= 0 && data.down.times === 0 ? 'none' : 'down',
                                    }
                                })

                            // Создаем сегменты линии с разными цветами
                            const segments = svgPoints.slice(0, -1).map((point, index) => {
                                const nextPoint = svgPoints[index + 1]

                                // Определяем цвет сегмента на основе статусов точек
                                let segmentColor = 'var(--my-alpha-gray-color)'
                                if (point.status === 'ok' && nextPoint.status === 'ok') {
                                    segmentColor = '#1aad3a'
                                } else if (point.status === 'down' || nextPoint.status === 'down') {
                                    segmentColor = '#ea4e43'
                                } else if (point.status === 'ok' || nextPoint.status === 'ok') {
                                    segmentColor = '#1aad3a'
                                }

                                // Задержка для появления сегментов
                                const segmentDelay = index * 50 + 100 // Линии появляются после точек

                                return (
                                    <path
                                        key={index}
                                        className="timeline-segment"
                                        d={`M ${point.x} ${point.y} L ${nextPoint.x} ${nextPoint.y}`}
                                        fill="none"
                                        stroke={segmentColor}
                                        strokeWidth="2"
                                        strokeLinejoin="round"
                                        strokeLinecap="round"
                                        style={{ animationDelay: `${segmentDelay}ms` }}
                                    />
                                )
                            })

                            return (
                                <svg className="timeline-graph" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    {segments}
                                </svg>
                            )
                        })()}
                        {(() => {
                            // Находим индекс самой правой точки с данными
                            const dataPoints = site.daily.slice().reverse()
                            let latestDataIndex = -1
                            for (let i = dataPoints.length - 1; i >= 0; i--) {
                                if (!(dataPoints[i].uptime <= 0 && dataPoints[i].down.times === 0)) {
                                    latestDataIndex = i
                                    break
                                }
                            }

                            return dataPoints.map((data, index) => {
                                let statusClass = ''
                                let text = data.date.format('DD.MM.YYYY ')
                                let topPosition = '50%' // По умолчанию по центру

                                if (data.uptime >= 100) {
                                    statusClass = 'ok'
                                    topPosition = '35%' // Выше центра для OK
                                    text += `${t('availability')} ${formatNumber(data.uptime)}%`
                                } else if (data.uptime <= 0 && data.down.times === 0) {
                                    statusClass = 'none'
                                    topPosition = '50%' // По центру для нет данных
                                    text += t('noData')
                                } else {
                                    statusClass = 'down'
                                    topPosition = '65%' // Ниже центра для DOWN
                                    text += `Сбоев ${data.down.times}, суммарно ${formatDuration(data.down.duration)}, ${t(
                                        'availability'
                                    ).toLowerCase()} ${formatNumber(data.uptime)}%`
                                }

                                // Добавляем свечение для самой правой точки с данными
                                if (index === latestDataIndex && statusClass !== 'none') {
                                    statusClass += ` latest-${statusClass}`
                                }

                                const dayPosition = (index / (site.daily.length - 1)) * 100
                                // Случайная задержка от 50мс до 200мс для каждой точки
                                const randomDelay = 50 + Math.random() * 150
                                const animationDelay = index * 30 + randomDelay // Базовая задержка + случайная

                                return (
                                    <div
                                        key={index}
                                        className={`timeline-point ${statusClass} timeline-point-animate`}
                                        style={{
                                            left: `${dayPosition}%`,
                                            top: topPosition,
                                            animationDelay: `${animationDelay}ms`,
                                        }}
                                        data-tip={text}
                                    />
                                )
                            })
                        })()}
                    </div>
                    <div className="timeline-labels d-flex justify-content-between mt-2">
                        <small className="my-text-content">{t('daysAgo', { days: CountDays })}</small>
                        <small className="my-text-content">{t('today')}</small>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-6">
                        <div className="stats-item">
                            <span className="my-text-content">{t('averageAvailability')}</span>
                            <span className="my-text-heading fw-semibold">{site.average}%</span>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="stats-item">
                            <span className="my-text-content">
                                {site.total.times ? t('outagesFor', { days: CountDays }) : t('noOutagesFor', { days: CountDays })}
                            </span>
                            <span className="my-text-heading fw-semibold">
                                {site.total.times
                                    ? t('outagesCount', { count: site.total.times, duration: formatDuration(site.total.duration) })
                                    : t('noOutages')}
                            </span>
                        </div>
                    </div>

                    {/* Показываем пинг в блоке статистики, если URL настроен */}
                    {pingUrl && (
                        <div className="col-md-6 ping-stats-col">
                            <div className="stats-item ping-stats-item">
                                <span className="my-text-content">{t('pingStatus')}</span>
                                {(() => {
                                    const formatted = formatPing(pingResult)
                                    // Формируем tooltip без строки Details с переводами
                                    const tooltipText = pingResult
                                        ? `${t('pingAvg')}: ${pingResult.avg}ms\n${t('pingMinMax')}: ${pingResult.min}/${
                                              pingResult.max
                                          }ms\n\n${t('pingNote')}`
                                        : t('pingMeasuring')
                                    return (
                                        <span
                                            className={`my-text-heading fw-semibold ping-stats-value ${formatted.class} ${
                                                pingLoading ? 'ping-loading' : ''
                                            }`}
                                            data-tip={tooltipText}
                                        >
                                            📡 {pingLoading ? '...' : formatted.text}
                                        </span>
                                    )
                                })()}
                            </div>
                        </div>
                    )}
                </div>

                <ReactTooltip className="tooltip" place="top" type="dark" effect="solid" multiline={true} delayShow={200} delayHide={100} />
            </div>
        )
    })
}

export default UptimeRobot
