import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../api/authApi'

type Status = 'loading' | 'success' | 'error'

export function VerifyEmailPage() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    const [status, setStatus] = useState<Status>('loading')

    useEffect(() => {
        if (!token) {
            setStatus('error')
            return
        }
        verifyEmail(token)
            .then(() => setStatus('success'))
            .catch(() => setStatus('error'))
    }, [token])

    return (
        <main className="page">
            <h1>Підтвердження email</h1>
            {status === 'loading' && <p>Перевіряємо посилання…</p>}
            {status === 'success' && <p>Email підтверджено. Дякуємо!</p>}
            {status === 'error' && <p className="error">Посилання недійсне або протерміноване.</p>}
            <p><Link to="/profile">Перейти до профілю</Link></p>
        </main>
    )
}