import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Locale, translations } from './translations'

const STORAGE_KEY = 'catchclass-locale'

function readStoredLocale(): Locale {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored === 'uk' || stored === 'en') return stored
    } catch {
        // localStorage недоступний (приватний режим тощо) — просто йдемо на дефолт.
    }
    return 'uk'
}

function getByPath(obj: unknown, path: string[]): unknown {
    return path.reduce<unknown>((acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined), obj)
}

interface I18nContextValue {
    locale: Locale
    setLocale: (locale: Locale) => void
    t: (key: string, vars?: Record<string, string | number>) => string
    /** Пряме читання значення-масиву зі словника (назви місяців/днів тижня). */
    tList: (key: string) => string[]
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(readStoredLocale)

    useEffect(() => {
        document.documentElement.lang = locale
    }, [locale])

    const setLocale = useCallback((next: Locale) => {
        setLocaleState(next)
        try {
            localStorage.setItem(STORAGE_KEY, next)
        } catch {
            // Нічого страшного — мова просто не переживе перезавантаження сторінки.
        }
    }, [])

    const t = useCallback((key: string, vars?: Record<string, string | number>) => {
        const value = getByPath(translations[locale], key.split('.'))
        let text = typeof value === 'string' ? value : key
        if (vars) {
            for (const [name, v] of Object.entries(vars)) {
                text = text.replace(`{{${name}}}`, String(v))
            }
        }
        return text
    }, [locale])

    const tList = useCallback((key: string) => {
        const value = getByPath(translations[locale], key.split('.'))
        return Array.isArray(value) ? (value as string[]) : []
    }, [locale])

    const value = useMemo(() => ({ locale, setLocale, t, tList }), [locale, setLocale, t, tList])

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
    const ctx = useContext(I18nContext)
    if (!ctx) throw new Error('useI18n must be used within an I18nProvider')
    return ctx
}
