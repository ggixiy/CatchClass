import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/shared/api/http'
import { useI18n } from '@/shared/i18n/I18nContext'
import { login } from '../api/authApi'
import { AuthLayout } from '../components/AuthLayout'

export function LoginPage() {
    const { t } = useI18n()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setError(null)
        try {
            await login(email, password)
            navigate('/profile')
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('auth.login.error'))
        }
    }

    return (
        <AuthLayout visualText={t('auth.visual.login')} title={t('auth.login.title')} subtitle={t('auth.login.subtitle')}>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit} className="auth-form">
                <label className="auth-field">
                    <span>Email</span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                <label className="auth-field">
                    <span>{t('common.password')}</span>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </label>
                <button type="submit" className="auth-submit">{t('auth.login.submit')}</button>
            </form>
            <p className="auth-links"><Link to="/signup">{t('auth.login.noAccount')}</Link></p>
            <p className="auth-links"><Link to="/forgot-password">{t('auth.login.forgot')}</Link></p>
        </AuthLayout>
    )
}
