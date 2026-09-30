import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '@/features/auth'
import { ApiError } from '@/shared/api/http'
import { deleteMyPhoto, getMyProfile, updateMyProfile, uploadMyPhoto, UserProfile } from '../api/userApi'
import {Avatar} from "@/shared/ui/Avatar";

export function ProfilePage() {
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
                    setError('Не вдалося завантажити профіль')
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
            setError(err instanceof ApiError ? err.message : 'Не вдалося оновити профіль')
        }
    }

    async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setError(null)

        if (file.size > MAX_PHOTO_BYTES) {
            setError('Файл завеликий. Максимальний розмір — 2 МБ')
            e.target.value = ''
            return
        }

        try {
            setProfile(await uploadMyPhoto(file))
            setPhotoVersion((v) => v + 1)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Не вдалося завантажити фото')
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
            setError(err instanceof ApiError ? err.message : 'Не вдалося видалити фото')
        }
    }

    async function handleLogout() {
        await logout()
        navigate('/login')
    }

    if (loading) return <main className="page"><p>Завантаження…</p></main>
    if (error && !profile) return <main className="page"><p className="error">{error}</p></main>
    if (!profile) return null

    return (
        <main className="page">
            <h1>Профіль</h1>
            {error && <p className="error">{error}</p>}

            <div className="avatar-row">
                <Avatar photoUrl={profile.photoUrl ? `${profile.photoUrl}?v=${photoVersion}` : null} displayName={profile.displayName} />
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handlePhotoChange}
                        style={{ display: 'none' }}
                    />
                    <button type="button" onClick={() => fileInputRef.current?.click()}>Завантажити фото</button>
                    {profile.photoUrl && <button type="button" onClick={handlePhotoRemove}>Видалити</button>}
                </div>
            </div>

            <p>{profile.email}</p>
            <form onSubmit={handleUpdate}>
                <input
                    placeholder="Ім'я"
                    value={profile.displayName}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                />
                <button type="submit">Зберегти</button>
            </form>
            <button type="button" onClick={handleLogout}>Вийти</button>
        </main>
    )
}