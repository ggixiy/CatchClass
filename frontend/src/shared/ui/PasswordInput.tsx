import { InputHTMLAttributes, useState } from 'react'
import { useI18n } from '@/shared/i18n/I18nContext'
import { EyeIcon, EyeOffIcon } from './icons'

// Поле пароля з кнопкою «показати / сховати».
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
    const { t } = useI18n()
    const [visible, setVisible] = useState(false)
    return (
        <span className="password-input">
            <input {...props} type={visible ? 'text' : 'password'} />
            <button
                type="button"
                className="password-toggle"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? t('common.hidePassword') : t('common.showPassword')}
                title={visible ? t('common.hidePassword') : t('common.showPassword')}
            >
                {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
        </span>
    )
}
