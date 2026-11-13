import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/shared/api/http'
import { useI18n } from '@/shared/i18n/I18nContext'
import { forgotPassword } from '../api/authApi'
import { AuthLayout } from '../components/AuthLayout'

export function ForgotPasswordPage() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.forgot.error'))
    }
  }

  if (sent) {
    return (
      <AuthLayout visualText={t('auth.visual.forgot')} title={t('auth.forgot.sentTitle')} subtitle={t('auth.forgot.sentBody')}>
        <p className="auth-links"><Link to="/login">{t('auth.forgot.backToLogin')}</Link></p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout visualText={t('auth.visual.forgot')} title={t('auth.forgot.title')} subtitle={t('auth.forgot.hint')}>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="auth-form">
        <label className="auth-field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <button type="submit" className="auth-submit">{t('auth.forgot.submit')}</button>
      </form>
      <p className="auth-links"><Link to="/login">{t('auth.forgot.backToLogin')}</Link></p>
    </AuthLayout>
  )
}
