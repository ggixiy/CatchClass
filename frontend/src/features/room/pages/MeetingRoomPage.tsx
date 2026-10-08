import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from '@livekit/components-react'
import '@livekit/components-styles'
import { ApiError } from '@/shared/api/http'
import { getRoomStatus } from '../api/roomApi'

interface RoomConnectionInfo {
    accessToken: string
    serverUrl: string
    roomName: string
}

// Описуємо пропси вручну, а не через ComponentProps<typeof LiveKitRoom> — сам LiveKitRoom
// через конфлікт версій типів React (@livekit/components-react типізований під новішу
// версію, де ReactNode включає undefined, а наш проєкт — під React 18.2 за вимогою ТЗ)
// не відповідає формальній вимозі "це React-компонент", тож TypeScript не може навіть
// дістати з нього список пропсів автоматично.
interface LiveKitRoomCompatProps {
    token: string
    serverUrl: string
    connect?: boolean
    video?: boolean
    audio?: boolean
    'data-lk-theme'?: string
    style?: CSSProperties
    onDisconnected?: () => void
    children?: ReactNode
}

const TypedLiveKitRoom = LiveKitRoom as unknown as (props: LiveKitRoomCompatProps) => JSX.Element

export function MeetingRoomPage() {
    const { meetingId } = useParams<{ meetingId: string }>()
    const location = useLocation()
    const navigate = useNavigate()
    const passedState = location.state as RoomConnectionInfo | undefined

    const [connection, setConnection] = useState<RoomConnectionInfo | null>(passedState ?? null)
    const [error, setError] = useState<string | null>(null)

    // Якщо сюди потрапили без стану переходу (наприклад, F5 посеред заняття) —
    // донабираємо дані через /status: уже допущений учасник лишається ADMITTED.
    useEffect(() => {
        if (connection || !meetingId) return
        getRoomStatus(meetingId)
            .then((result) => {
                if (result.status === 'ADMITTED' && result.accessToken && result.serverUrl) {
                    setConnection({ accessToken: result.accessToken, serverUrl: result.serverUrl, roomName: result.roomName })
                } else {
                    navigate('/')
                }
            })
            .catch((err) => {
                setError(err instanceof ApiError ? err.message : 'Не вдалося підключитись до заняття')
            })
    }, [connection, meetingId, navigate])

    if (error) return <main className="page"><p className="error">{error}</p></main>
    if (!connection) return <main className="page"><p>Підключення…</p></main>

    return (
        <TypedLiveKitRoom
            token={connection.accessToken}
            serverUrl={connection.serverUrl}
            connect
            video
            audio
            data-lk-theme="default"
            style={{ height: '100vh' }}
            onDisconnected={() => navigate('/')}
        >
            <RoomAudioRenderer />
            <VideoConference />
        </TypedLiveKitRoom>
    )
}