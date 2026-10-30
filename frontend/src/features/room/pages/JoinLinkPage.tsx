import { useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

// Посилання виду /join/<Meeting ID>?password=…: пароль (якщо він потрібен) уже в самому посиланні,
// тож людині нічого вводити не треба — одразу відкриваємо екран перевірки камери/мікрофона.
export function JoinLinkPage() {
    const { publicId = '' } = useParams<{ publicId: string }>()
    const [params] = useSearchParams()
    const navigate = useNavigate()

    useEffect(() => {
        navigate('/prejoin', { replace: true, state: { publicId, password: params.get('password') ?? '' } })
    }, [navigate, publicId, params])

    return null
}
