import { FormEvent, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '@/shared/api/http'
import { useI18n } from '@/shared/i18n/I18nContext'
import { resetPassword } from '../api/authApi'

export function ResetPasswordPage() {
    const { t } = useI18n()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token') ?? ''
    const navigate = useNavigate()

    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setError(null)
        try {
            await resetPassword(token, password)
            navigate('/login')
        } catch (err) {
            if (err instanceof ApiError) {
                const fieldError = err.problem.errors && Object.values(err.problem.errors)[0]
                setError(fieldError ?? err.message)
            } else {
                setError(t('auth.reset.error'))
            }
        }
    }

    if (!token) {
        return (
            <main className="page">
                <h1>{t('auth.reset.invalidTitle')}</h1>
                <p className="error">{t('auth.reset.invalidBody')}</p>
                <p><Link to="/forgot-password">{t('auth.reset.requestNew')}</Link></p>
            </main>
        )
    }

    return (
        <main className="page">
            <h1>{t('auth.reset.title')}</h1>
            <p className="hint">{t('auth.reset.hint')}</p>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    placeholder={t('auth.reset.placeholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">{t('auth.reset.submit')}</button>
            </form>
        </main>
    )
}
