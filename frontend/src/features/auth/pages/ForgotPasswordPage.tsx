import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/shared/api/http'
import { forgotPassword } from '../api/authApi'

export function ForgotPasswordPage() {
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
      setError(err instanceof ApiError ? err.message : 'Щось пішло не так')
    }
  }

  if (sent) {
    return (
      <main className="page">
        <h1>Перевірте пошту</h1>
        <p>Якщо такий email зареєстровано, ми надіслали лист із посиланням для скидання пароля.</p>
        <p><Link to="/login">Повернутися до входу</Link></p>
      </main>
    )
  }

  return (
    <main className="page">
      <h1>Забули пароль?</h1>
      <p className="hint">Вкажіть email — надішлемо посилання для скидання пароля.</p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button type="submit">Надіслати</button>
      </form>
      <p><Link to="/login">Повернутися до входу</Link></p>
    </main>
  )
}