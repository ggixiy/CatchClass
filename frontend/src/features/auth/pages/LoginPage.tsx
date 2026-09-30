import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/shared/api/http'
import { login } from '../api/authApi'

export function LoginPage() {
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
            setError(err instanceof ApiError ? err.message : 'Не вдалося увійти')
        }
    }

    return (
        <main className="page">
            <h1>Вхід</h1>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Увійти</button>
            </form>
            <p><Link to="/signup">Ще немає акаунту? Зареєструватись</Link></p>
            <p><Link to="/forgot-password">Забули пароль?</Link></p>
        </main>
    )
}