import { useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import Link from './link'
import ThemeSwitcher from './theme-switcher'

const Header = () => {
    const { locale, changeLanguage, t } = useLanguage()

    const handleLanguageChange = (newLocale) => {
        changeLanguage(newLocale)
    }

    useEffect(() => {
        document.title = window.Config.SiteName
    }, [])

    return (
        <header className="navbar my-navbar navbar-expand-sm pb-5">
            <div className="container my-container px-3">
                <div className="navbar-brand">
                    <a href="https://t.me/nerjel_bot" target="_blank" rel="noopener noreferrer">

                        <img className="logo-light" src="https://i.ibb.co/1G0VYLwL/695bf8450615.png" alt="Logo" height="70" />
                        <img className="logo-dark" src="https://i.ibb.co/pCWLhd2/7fff0d1aad97.png" alt="Logo" height="70" />

                    </a>
                </div>

                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-collapse-content">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="navbar-collapse collapse mt-2 mt-sm-0" id="navbar-collapse-content">
                    <ul className="navbar-nav ms-auto">
                        {window.Config.Navi.map((item, index) => (
                            <li key={index} className="nav-item">
                                <Link className="nav-link my-nav-link" to={item.url} text={t(item.text)} />
                            </li>
                        ))}

                        <ThemeSwitcher />

                        <li className="nav-item dropdown my-dropdown">
                            <a
                                className="nav-link my-nav-link dropdown-toggle"
                                role="button"
                                data-bs-toggle="dropdown"
                                tabIndex="0"
                                aria-expanded="false"
                            >
                                <svg className="bi my-nav-link-icon" width="1em" height="1em" fill="currentColor">
                                    <use href="#translate"></use>
                                </svg>
                                <span className="my-nav-link-text">{locale === 'ru' ? 'Русский' : 'English'}</span>
                            </a>
                            <ul className="dropdown-menu">
                                <li>
                                    <button
                                        className={`dropdown-item my-dropdown-item-lang ${locale === 'en' ? 'active' : ''}`}
                                        type="button"
                                        onClick={() => handleLanguageChange('en')}
                                        aria-pressed={locale === 'en'}
                                    >
                                        <span>English</span>
                                        <svg className="bi my-dropdown-item-check" width="1em" height="1em" fill="currentColor">
                                            <use href="#check-lg"></use>
                                        </svg>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className={`dropdown-item my-dropdown-item-lang ${locale === 'ru' ? 'active' : ''}`}
                                        type="button"
                                        onClick={() => handleLanguageChange('ru')}
                                        aria-pressed={locale === 'ru'}
                                    >
                                        <span>Русский</span>
                                        <svg className="bi my-dropdown-item-check" width="1em" height="1em" fill="currentColor">
                                            <use href="#check-lg"></use>
                                        </svg>
                                    </button>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </header>
    )
}

export default Header
