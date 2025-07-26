import { useEffect, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import { getCountryCodeFromServerName, getCountryName } from '../common/country-flags'
import { formatDuration, formatNumber } from '../common/helper'
import { GetMonitors } from '../common/uptimerobot'
import { useLanguage } from '../contexts/LanguageContext'
import Link from './link'

const UptimeRobot = ({ apikey }) => {
    const { t } = useLanguage()

    const status = {
        ok: t('statusWorking'),
        down: t('statusDown'),
        unknow: t('statusUnknown'),
    }

    const { CountDays, ShowLink } = window.Config
    const [monitors, setMonitors] = useState(null)
    const [loading, setLoading] = useState(true)

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
                        {site.daily
                            .slice()
                            .reverse()
                            .map((data, index) => {
                                let statusClass = ''
                                let text = data.date.format('DD.MM.YYYY ')

                                if (data.uptime >= 100) {
                                    statusClass = 'ok'
                                    text += `${t('availability')} ${formatNumber(data.uptime)}%`
                                } else if (data.uptime <= 0 && data.down.times === 0) {
                                    statusClass = 'none'
                                    text += t('noData')
                                } else {
                                    statusClass = 'down'
                                    text += `Сбоев ${data.down.times}, суммарно ${formatDuration(data.down.duration)}, ${t(
                                        'availability'
                                    ).toLowerCase()} ${formatNumber(data.uptime)}%`
                                }

                                return <div key={index} className={`timeline-item ${statusClass}`} data-tip={text} title={text} />
                            })}
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
                </div>

                <ReactTooltip className="tooltip" place="top" type="dark" effect="solid" />
            </div>
        )
    })
}

export default UptimeRobot
