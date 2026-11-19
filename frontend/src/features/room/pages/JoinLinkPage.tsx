import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '@/shared/api/http'
import { tokenStore } from '@/shared/api/tokenStore'
import { useI18n } from '@/shared/i18n/I18nContext'
import { clearPendingJoin, readPendingJoin, savePendingJoin } from '@/shared/lib/pendingJoin'
import { checkRoom } from '../api/roomApi'

// Посилання виду /join/<Meeting ID>?password=…: пароль (якщо він потрібен) уже в самому посиланні,
// тож людині нічого вводити не треба.
// - Не авторизована → запам'ятовуємо дані зустрічі, ведемо на вхід; після входу/реєстрації
//   вона повертається сюди й потрапляє на перевірку камери/мікрофона без повторного введення.
// - Авторизована → спершу перевіряємо Meeting ID і пароль, і лише тоді ведемо далі.
export function JoinLinkPage() {
    const { t } = useI18n()
    const { publicId = '' } = useParams<{ publicId: string }>()
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const pending = readPendingJoin()
        const password = params.get('password') ?? (pending?.publicId === publicId ? pending.password : '')

        if (tokenStore.getAccessToken() === null) {
            savePendingJoin({ publicId, password })
            navigate('/login', { replace: true })
            return
        }

        let active = true
        checkRoom(publicId, password)
            .then((result) => {
                if (!active) return
                clearPendingJoin()
                navigate('/prejoin', { replace: true, state: { publicId, password, title: result.title } })
            })
            .catch((err) => {
                if (!active) return
                clearPendingJoin()
                setError(err instanceof ApiError ? err.message : t('joinLink.checkError'))
            })
        return () => { active = false }
    }, [navigate, publicId, params, t])

    if (error) {
        return (
            <main className="page">
                <h1>{t('joinLink.failedTitle')}</h1>
                <p className="error">{error}</p>
                <div className="form-actions">
                    <button type="button" className="btn-primary" onClick={() => navigate('/')}>{t('joinLink.toHome')}</button>
                </div>
            </main>
        )
    }
    return <main className="page"><p>{t('common.loading')}</p></main>
}
