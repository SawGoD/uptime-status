import { useEffect, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

const ThemeSwitcher = () => {
    const { t } = useLanguage()
    const [currentTheme, setCurrentTheme] = useState('system')

    const themes = [
        { value: 'system', label: t('system'), icon: '#circle-half' },
        { value: 'light', label: t('light'), icon: '#sun-fill' },
        { value: 'dark', label: t('dark'), icon: '#moon-stars-fill' },
    ]

    const COLOR_SCHEME = '(prefers-color-scheme: dark)'
    const META_THEME_COLORS = { light: '#fff', dark: '#151515' }

    const getUserTheme = () => {
        return localStorage.getItem('theme') || 'system'
    }

    const setTheme = (theme) => {
        let actualTheme = theme
        if (theme === 'system') {
            actualTheme = window.matchMedia(COLOR_SCHEME).matches ? 'dark' : 'light'
        }
        document.documentElement.setAttribute('data-bs-theme', actualTheme)
        const themeColorMeta = document.querySelector(`[name='theme-color']`)
        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', META_THEME_COLORS[actualTheme])
        }
    }

    const handleThemeChange = (newTheme) => {
        localStorage.setItem('theme', newTheme)
        setCurrentTheme(newTheme)
        setTheme(newTheme)
    }

    useEffect(() => {
        const theme = getUserTheme()
        setCurrentTheme(theme)
        setTheme(theme)

        // Слушаем изменения системной темы
        const mediaQuery = window.matchMedia(COLOR_SCHEME)
        const handleSystemThemeChange = () => {
            if (getUserTheme() === 'system') {
                setTheme('system')
            }
        }

        mediaQuery.addEventListener('change', handleSystemThemeChange)
        return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }, [])

    const currentThemeConfig = themes.find((theme) => theme.value === currentTheme) || themes[0]

    return (
        <li className="nav-item dropdown my-dropdown">
            <a className="nav-link my-nav-link dropdown-toggle" id="btn-theme" role="button" data-bs-toggle="dropdown" href="#">
                <svg className="bi my-nav-link-icon">
                    <use href={currentThemeConfig.icon}></use>
                </svg>
                <span className="my-nav-link-text">{currentThemeConfig.label}</span>
            </a>
            <ul className="dropdown-menu">
                {themes.map((theme) => (
                    <li key={theme.value}>
                        <button
                            className={`dropdown-item my-dropdown-item-theme ${currentTheme === theme.value ? 'active' : ''}`}
                            type="button"
                            onClick={() => handleThemeChange(theme.value)}
                        >
                            <svg className="bi my-dropdown-item-icon">
                                <use href={theme.icon}></use>
                            </svg>
                            <span>{theme.label}</span>
                            <svg className="bi my-dropdown-item-check">
                                <use href="#check-lg"></use>
                            </svg>
                        </button>
                    </li>
                ))}
            </ul>
        </li>
    )
}

export default ThemeSwitcher
