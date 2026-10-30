import { useI18n } from '../i18n/I18nContext'

// Перемикач UK/EN — свідомо текстовий (а не прапорці), бо прапорець не має
// однозначного зв'язку з мовою (UA ≠ "українська мова" для частини аудиторії).
export function LanguageToggle() {
    const { locale, setLocale } = useI18n()

    return (
        <div className="language-toggle" role="group" aria-label="Language">
            <button
                type="button"
                className={locale === 'uk' ? 'language-toggle-active' : ''}
                onClick={() => setLocale('uk')}
            >
                UK
            </button>
            <button
                type="button"
                className={locale === 'en' ? 'language-toggle-active' : ''}
                onClick={() => setLocale('en')}
            >
                EN
            </button>
        </div>
    )
}
