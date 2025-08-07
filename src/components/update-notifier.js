import { useEffect, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

const UpdateNotifier = () => {
    const { t } = useLanguage()
    const [updateAvailable, setUpdateAvailable] = useState(false)
    const [registration, setRegistration] = useState(null)

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then((reg) => {
                if (reg) {
                    setRegistration(reg)

                    // Проверяем обновления
                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    console.log('Обновление доступно!')
                                    setUpdateAvailable(true)
                                }
                            })
                        }
                    })
                }
            })

            // Слушаем сообщения от Service Worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'UPDATE_AVAILABLE') {
                    setUpdateAvailable(true)
                }
            })
        }
    }, [])

    const handleUpdate = () => {
        if (registration) {
            // Отправляем сообщение SW для активации обновления
            if (registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' })
            }

            // Перезагружаем страницу
            window.location.reload()
        }
    }

    const handleDismiss = () => {
        setUpdateAvailable(false)
    }

    if (!updateAvailable) {
        return null
    }

    return (
        <div className="position-fixed bottom-0 start-50 translate-middle-x p-3" style={{ zIndex: 1050 }}>
            <div className="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                <div className="toast-header">
                    <div className="bg-primary rounded me-2" style={{ width: '20px', height: '20px' }}></div>
                    <strong className="me-auto">{t('updateAvailable')}</strong>
                    <button type="button" className="btn-close" onClick={handleDismiss} aria-label="Close"></button>
                </div>
                <div className="toast-body">
                    <p className="mb-2">{t('updateDescription')}</p>
                    <div className="d-flex gap-2">
                        <button type="button" className="btn btn-primary btn-sm" onClick={handleUpdate}>
                            {t('updateNow')}
                        </button>
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleDismiss}>
                            {t('later')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UpdateNotifier
