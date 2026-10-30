import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/shared/api/http'
import { useI18n } from '@/shared/i18n/I18nContext'
import { register } from '../api/authApi'

export function SignUpPage() {
    const { t } = useI18n()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setError(null)
        try {
            await register(email, displayName, password)
            navigate('/profile')
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('auth.signup.error'))
        }
    }

    return (
        <main className="page">
            <h1>{t('auth.signup.title')}</h1>
            <p className="hint">{t('auth.signup.passwordHint')}</p>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input placeholder={t('auth.signup.namePlaceholder')} value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                <input type="password" placeholder={t('common.password')} value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">{t('auth.signup.submit')}</button>
            </form>
            <p><Link to="/login">{t('auth.signup.haveAccount')}</Link></p>
        </main>
    )
}
