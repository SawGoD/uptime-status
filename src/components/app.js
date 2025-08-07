import { useMemo } from 'react'
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext'
import Header from './header'
import Link from './link'

import UptimeRobot from './uptimerobot'

const AppContent = () => {
    const { t } = useLanguage()
    const apikeys = useMemo(() => {

        if (!window.Config) {
            console.error('window.Config не найден. Убедитесь, что config.js загружен.')
            return []
        }

        const { ApiKeys } = window.Config
        if (Array.isArray(ApiKeys)) return ApiKeys
        if (typeof ApiKeys === 'string') return [ApiKeys]
        return []
    }, [])

    return (
        <>
            <Header />
            <div className="container my-container px-3 pb-3">
                <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
                    <h4 className="my-text-heading fw-bold me-auto mb-0">{t('serverStatus')}</h4>
                </div>

                <div id="uptime" className="row g-3 mb-5">

                    {apikeys.map((key, index) => (
                        <div key={key} className="col-12">
                            <UptimeRobot apikey={key} pingUrl={window.Config?.PingUrls?.[index]} />

                        </div>
                    ))}
                </div>

                <div className="my-block text-center">
                    <p className="my-text-content mb-2">
                        {t('footerText')} <Link to="https://stats.uptimerobot.com/x1NckS5b95" text="UptimeRobot" />
                    </p>
                </div>
            </div>

        </>
    )
}

const App = () => {
    return (
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    )
}

export default App
