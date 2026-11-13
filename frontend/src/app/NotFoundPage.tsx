import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { useI18n } from '@/shared/i18n/I18nContext'

// Сторінка 404: та сама візуальна мова, що й сторінки входу — панель із рожевими смугами ліворуч.
export function NotFoundPage() {
    const { t } = useI18n()
    const navigate = useNavigate()

    return (
        <AuthLayout
            visualText={<><span className="notfound-code">404</span><span className="notfound-text">{t('notFound.visual')}</span></>}
            title={t('notFound.title')}
            subtitle={t('notFound.subtitle')}
        >
            <div className="notfound-actions">
                <Link to="/" className="notfound-home">{t('notFound.home')}</Link>
                <button type="button" className="notfound-back" onClick={() => navigate(-1)}>{t('notFound.back')}</button>
            </div>
        </AuthLayout>
    )
}
