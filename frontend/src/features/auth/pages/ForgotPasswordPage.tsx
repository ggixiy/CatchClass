import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/shared/api/http'
import { useI18n } from '@/shared/i18n/I18nContext'
import { forgotPassword } from '../api/authApi'

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
      <main className="page">
        <h1>{t('auth.forgot.sentTitle')}</h1>
        <p>{t('auth.forgot.sentBody')}</p>
        <p><Link to="/login">{t('auth.forgot.backToLogin')}</Link></p>
      </main>
    )
  }

  return (
    <main className="page">
      <h1>{t('auth.forgot.title')}</h1>
      <p className="hint">{t('auth.forgot.hint')}</p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button type="submit">{t('auth.forgot.submit')}</button>
      </form>
      <p><Link to="/login">{t('auth.forgot.backToLogin')}</Link></p>
    </main>
  )
}
