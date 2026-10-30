import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useI18n } from '@/shared/i18n/I18nContext'
import { verifyEmail } from '../api/authApi'

type Status = 'loading' | 'success' | 'error'

export function VerifyEmailPage() {
    const { t } = useI18n()
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
            <h1>{t('auth.verify.title')}</h1>
            {status === 'loading' && <p>{t('auth.verify.loading')}</p>}
            {status === 'success' && <p>{t('auth.verify.success')}</p>}
            {status === 'error' && <p className="error">{t('auth.verify.error')}</p>}
            <p><Link to="/profile">{t('auth.verify.goToProfile')}</Link></p>
        </main>
    )
}
