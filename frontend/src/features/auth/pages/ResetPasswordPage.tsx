import { FormEvent, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '@/shared/api/http'
import { resetPassword } from '../api/authApi'

export function ResetPasswordPage() {
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
                setError('Не вдалося встановити новий пароль')
            }
        }
    }

    if (!token) {
        return (
            <main className="page">
                <h1>Скидання пароля</h1>
                <p className="error">Посилання недійсне: не вказано токен.</p>
                <p><Link to="/forgot-password">Запросити нове посилання</Link></p>
            </main>
        )
    }

    return (
        <main className="page">
            <h1>Новий пароль</h1>
            <p className="hint">Пароль: щонайменше 8 символів, одна цифра й один спецсимвол.</p>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    placeholder="Новий пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Зберегти пароль</button>
            </form>
        </main>
    )
}