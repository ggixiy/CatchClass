import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '@/features/auth'
import { ApiError } from '@/shared/api/http'
import { useI18n } from '@/shared/i18n/I18nContext'
import { Avatar } from '@/shared/ui/Avatar'
import { ImageIcon, PhotoCameraIcon, TrashIcon } from '@/shared/ui/icons'
import { deleteMyBanner, deleteMyPhoto, getMyProfile, updateMyProfile, uploadMyBanner, uploadMyPhoto, UserProfile } from '../api/userApi'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024 // 2 МБ — те саме число, що на бекенді

// Профіль: банер із аватаром (банер потім показується фоном плитки користувача в конференції),
// логін, який можна змінити, і пошта, яка лише відображається.
export function ProfilePage() {
    const { t } = useI18n()
    const navigate = useNavigate()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saved, setSaved] = useState(false)
    // Адреса фото не змінюється після оновлення — додаємо версію, щоб браузер не показав кеш.
    // Банер має версію в самому посиланні (бекенд додає ?v=...).
    const [photoVersion, setPhotoVersion] = useState(0)
    const photoInput = useRef<HTMLInputElement>(null)
    const bannerInput = useRef<HTMLInputElement>(null)

    useEffect(() => {
        getMyProfile()
            .then(setProfile)
            .catch((err) => {
                if (err instanceof ApiError && (err.problem.status === 401 || err.problem.status === 403)) {
                    navigate('/login')
                } else {
                    setError(t('profile.loadError'))
                }
            })
            .finally(() => setLoading(false))
    }, [navigate])

    async function handleUpdate(e: FormEvent) {
        e.preventDefault()
        if (!profile) return
        setError(null)
        try {
            setProfile(await updateMyProfile(profile.displayName))
            setSaved(true)
            window.setTimeout(() => setSaved(false), 1800)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('profile.updateError'))
        }
    }

    async function pickImage(e: ChangeEvent<HTMLInputElement>, upload: (f: File) => Promise<UserProfile>, fallback: string, bumpPhoto: boolean) {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        setError(null)
        if (file.size > MAX_IMAGE_BYTES) {
            setError(t('profile.photoTooLarge'))
            return
        }
        try {
            setProfile(await upload(file))
            if (bumpPhoto) setPhotoVersion((v) => v + 1)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : fallback)
        }
    }

    async function removeImage(remove: () => Promise<UserProfile>, fallback: string, bumpPhoto: boolean) {
        setError(null)
        try {
            setProfile(await remove())
            if (bumpPhoto) setPhotoVersion((v) => v + 1)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : fallback)
        }
    }

    async function handleLogout() {
        await logout()
        navigate('/login')
    }

    if (loading) return <main className="profile-page"><p>{t('common.loading')}</p></main>
    if (error && !profile) return <main className="profile-page"><p className="error">{error}</p></main>
    if (!profile) return null

    return (
        <main className="profile-page">
            <article className="profile-card">
                <div
                    className={`profile-banner${profile.bannerUrl ? ' has-image' : ''}`}
                    style={profile.bannerUrl ? { backgroundImage: `url(${profile.bannerUrl})` } : undefined}
                >
                    <div className="profile-banner-actions">
                        <input ref={bannerInput} type="file" accept="image/png,image/jpeg,image/webp" hidden
                            onChange={(e) => pickImage(e, uploadMyBanner, t('profile.bannerUploadError'), false)} />
                        <button type="button" className="glass-pill" onClick={() => bannerInput.current?.click()}>
                            <ImageIcon size={16} />{t('profile.changeBanner')}
                        </button>
                        {profile.bannerUrl && (
                            <button type="button" className="glass-pill glass-pill-icon" title={t('profile.removeBanner')} aria-label={t('profile.removeBanner')}
                                onClick={() => removeImage(deleteMyBanner, t('profile.bannerRemoveError'), false)}>
                                <TrashIcon size={18} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="profile-head">
                    <div className="profile-avatar">
                        <Avatar size={112} photoUrl={profile.photoUrl ? `${profile.photoUrl}?v=${photoVersion}` : null} displayName={profile.displayName || '?'} />
                        <input ref={photoInput} type="file" accept="image/png,image/jpeg,image/webp" hidden
                            onChange={(e) => pickImage(e, uploadMyPhoto, t('profile.photoUploadError'), true)} />
                        <button type="button" className="profile-avatar-edit" title={t('profile.uploadPhoto')} aria-label={t('profile.uploadPhoto')}
                            onClick={() => photoInput.current?.click()}>
                            <PhotoCameraIcon size={20} />
                        </button>
                    </div>
                    <div className="profile-names">
                        <h1>{profile.displayName || t('profile.title')}</h1>
                        {profile.photoUrl && (
                            <button type="button" className="profile-remove-photo" onClick={() => removeImage(deleteMyPhoto, t('profile.photoRemoveError'), true)}>
                                <TrashIcon size={16} />{t('profile.removePhoto')}
                            </button>
                        )}
                    </div>
                </div>

                {error && <p className="error">{error}</p>}

                <form className="profile-fields" onSubmit={handleUpdate}>
                    <label className="profile-field">
                        <span className="profile-field-label">{t('profile.loginLabel')}</span>
                        <input
                            placeholder={t('profile.namePlaceholder')}
                            value={profile.displayName}
                            onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                        />
                    </label>

                    <div className="profile-field">
                        <span className="profile-field-label">{t('profile.emailLabel')}</span>
                        <div className="profile-locked" aria-readonly="true">{profile.email}</div>
                    </div>

                    <p className="hint profile-hint">{t('profile.bannerHint')}</p>

                    <div className="form-actions">
                        <button type="submit" className="btn-primary">{saved ? t('common.saved') : t('common.save')}</button>
                        <button type="button" className="btn-accent" onClick={handleLogout}>{t('profile.logout')}</button>
                    </div>
                </form>
            </article>
        </main>
    )
}
