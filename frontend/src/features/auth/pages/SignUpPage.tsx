import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/shared/api/http'
import { register } from '../api/authApi'

export function SignUpPage() {
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
            setError(err instanceof ApiError ? err.message : 'Не вдалося зареєструватися')
        }
    }

    return (
        <main className="page">
            <h1>Реєстрація</h1>
            <p className="hint">Пароль: щонайменше 8 символів, одна цифра й один спецсимвол.</p>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input placeholder="Ім'я" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Зареєструватися</button>
            </form>
            <p><Link to="/login">Вже є акаунт? Увійти</Link></p>
        </main>
    )
}