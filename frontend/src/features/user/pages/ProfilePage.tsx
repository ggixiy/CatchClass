import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '@/features/auth'
import { ApiError } from '@/shared/api/http'
import { useI18n } from '@/shared/i18n/I18nContext'
import { deleteMyPhoto, getMyProfile, updateMyProfile, uploadMyPhoto, UserProfile } from '../api/userApi'
import {Avatar} from "@/shared/ui/Avatar";

export function ProfilePage() {
    const { t } = useI18n()
    const navigate = useNavigate()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    // Бекенд повертає ту саму адресу фото після оновлення — без версії браузер
    // показав би стару картинку з кешу. Просте рішення: додати ?v=число до src.
    const [photoVersion, setPhotoVersion] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const MAX_PHOTO_BYTES = 2 * 1024 * 1024 // 2 МБ — те саме число, що на бекенді

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
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('profile.updateError'))
        }
    }

    async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setError(null)

        if (file.size > MAX_PHOTO_BYTES) {
            setError(t('profile.photoTooLarge'))
            e.target.value = ''
            return
        }

        try {
            setProfile(await uploadMyPhoto(file))
            setPhotoVersion((v) => v + 1)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('profile.photoUploadError'))
        } finally {
            e.target.value = ''
        }
    }

    async function handlePhotoRemove() {
        setError(null)
        try {
            setProfile(await deleteMyPhoto())
            setPhotoVersion((v) => v + 1)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('profile.photoRemoveError'))
        }
    }

    async function handleLogout() {
        await logout()
        navigate('/login')
    }

    if (loading) return <main className="page"><p>{t('common.loading')}</p></main>
    if (error && !profile) return <main className="page"><p className="error">{error}</p></main>
    if (!profile) return null

    return (
        <main className="page page-profile">
            <nav className="profile-nav">
                <button type="button" onClick={() => navigate('/')}>← {t('profile.backHome')}</button>
                <button type="button" className="btn-accent" onClick={handleLogout}>{t('profile.logout')}</button>
            </nav>
            <h1>{t('profile.title')}</h1>
            {error && <p className="error">{error}</p>}

            <div className="avatar-row">
                <Avatar size={128} photoUrl={profile.photoUrl ? `${profile.photoUrl}?v=${photoVersion}` : null} displayName={profile.displayName} />
                <div className="form-actions">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handlePhotoChange}
                        style={{ display: 'none' }}
                    />
                    <button type="button" onClick={() => fileInputRef.current?.click()}>{t('profile.uploadPhoto')}</button>
                    {profile.photoUrl && <button type="button" onClick={handlePhotoRemove}>{t('common.delete')}</button>}
                </div>
            </div>

            <form className="profile-form" onSubmit={handleUpdate}>
                <label>
                    {t('profile.emailLabel')}
                    <input value={profile.email} readOnly disabled />
                </label>
                <label>
                    {t('profile.loginLabel')}
                    <input
                        placeholder={t('profile.namePlaceholder')}
                        value={profile.displayName}
                        onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    />
                </label>
                <div className="form-actions">
                    <button type="submit" className="btn-primary">{t('common.save')}</button>
                </div>
            </form>
        </main>
    )
}
