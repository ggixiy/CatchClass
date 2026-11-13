import { FormEvent, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '@/shared/api/http'
import { useI18n } from '@/shared/i18n/I18nContext'
import { resetPassword } from '../api/authApi'
import { AuthLayout } from '../components/AuthLayout'

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
            <AuthLayout visualText={t('auth.visual.reset')} title={t('auth.reset.invalidTitle')}>
                <p className="error">{t('auth.reset.invalidBody')}</p>
                <p className="auth-links"><Link to="/forgot-password">{t('auth.reset.requestNew')}</Link></p>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout visualText={t('auth.visual.reset')} title={t('auth.reset.title')} subtitle={t('auth.reset.hint')}>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit} className="auth-form">
                <label className="auth-field">
                    <span>{t('auth.reset.placeholder')}</span>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </label>
                <button type="submit" className="auth-submit">{t('auth.reset.submit')}</button>
            </form>
        </AuthLayout>
    )
}
