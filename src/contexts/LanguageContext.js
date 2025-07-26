import { createContext, useContext, useState } from 'react'
import { getUserLocale, MESSAGES, setUserLocale } from '../common/i18n'

const LanguageContext = createContext()

export const useLanguage = () => {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}

export const LanguageProvider = ({ children }) => {
    const [locale, setLocale] = useState(getUserLocale())

    const changeLanguage = (newLocale) => {
        setUserLocale(newLocale)
        setLocale(newLocale)
    }

    // Функция для получения перевода с заменой параметров
    const t = (key, params = {}) => {
        const messages = MESSAGES[locale] || MESSAGES['ru']
        let translation = messages[key] || key

        // Заменяем параметры в переводе
        Object.keys(params).forEach((param) => {
            translation = translation.replace(`{${param}}`, params[param])
        })

        return translation
    }

    const value = {
        locale,
        changeLanguage,
        t,
    }

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
