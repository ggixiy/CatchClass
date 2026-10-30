import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/shared/api/http'
import { useI18n } from '@/shared/i18n/I18nContext'
import { login } from '../api/authApi'

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
        <main className="page">
            <h1>{t('auth.login.title')}</h1>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder={t('common.password')} value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">{t('auth.login.submit')}</button>
            </form>
            <p><Link to="/signup">{t('auth.login.noAccount')}</Link></p>
            <p><Link to="/forgot-password">{t('auth.login.forgot')}</Link></p>
        </main>
    )
}
