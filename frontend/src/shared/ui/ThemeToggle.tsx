import { useEffect, useState } from 'react'
import { MoonIcon, SunIcon } from './icons'
import { useI18n } from '../i18n/I18nContext'

type Theme = 'light' | 'dark'

function getSystemTheme(): Theme {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme(): Theme | null {
    try {
        const saved = localStorage.getItem('catchclass-theme')
        return saved === 'light' || saved === 'dark' ? saved : null
    } catch {
        return null
    }
}

// Невелика плаваюча кнопка-перемикач теми, доступна на всіх сторінках (підключена в App.tsx).
// index.html вже застосовує збережену тему ще до першого рендеру React, щоб уникнути
// "спалаху" не тієї теми — тут лише синхронізуємо стан кнопки й зберігаємо подальші зміни.
export function ThemeToggle() {
    const { t } = useI18n()
    const [theme, setTheme] = useState<Theme>(() => getStoredTheme() ?? getSystemTheme())

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        try {
            localStorage.setItem('catchclass-theme', theme)
        } catch {
            // приватний режим браузера чи заборонене сховище — просто не зберігаємо вибір
        }
    }, [theme])

    function toggle() {
        setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
    }

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={toggle}
            title={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
            aria-label={theme === 'dark' ? t('theme.enableLight') : t('theme.enableDark')}
        >
            {theme === 'dark' ? <SunIcon size={22} /> : <MoonIcon size={22} />}
        </button>
    )
}
