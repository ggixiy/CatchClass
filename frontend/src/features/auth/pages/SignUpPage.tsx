import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/shared/api/http'
import { useI18n } from '@/shared/i18n/I18nContext'
import { readPendingJoin } from '@/shared/lib/pendingJoin'
import { PasswordInput } from '@/shared/ui/PasswordInput'
import { register } from '../api/authApi'
import { AuthLayout } from '../components/AuthLayout'

export function SignUpPage() {
    const { t } = useI18n()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const pendingJoin = readPendingJoin()

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setError(null)
        try {
            await register(email, displayName, password)
            const pending = readPendingJoin()
            navigate(pending ? `/join/${encodeURIComponent(pending.publicId)}` : '/profile', { replace: true })
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('auth.signup.error'))
        }
    }

    return (
        <AuthLayout visualText={t('auth.visual.signup')} title={t('auth.signup.title')} subtitle={t('auth.signup.subtitle')}>
            {pendingJoin && <p className="hint">{t('auth.joinBanner', { id: pendingJoin.publicId })}</p>}
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit} className="auth-form">
                <label className="auth-field">
                    <span>Email</span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                <label className="auth-field">
                    <span>{t('auth.signup.namePlaceholder')}</span>
                    <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                </label>
                <label className="auth-field">
                    <span>{t('common.password')}</span>
                    <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <small className="hint">{t('auth.signup.passwordHint')}</small>
                </label>
                <button type="submit" className="auth-submit">{t('auth.signup.submit')}</button>
            </form>
            <p className="auth-links"><Link to="/login">{t('auth.signup.haveAccount')}</Link></p>
        </AuthLayout>
    )
}
