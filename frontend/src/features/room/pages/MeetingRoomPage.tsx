import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { DisconnectReason } from 'livekit-client'
import { LiveKitRoom } from '@livekit/components-react'
import '@livekit/components-styles'
import '../livekit-theme.css'
import { ApiError } from '@/shared/api/http'
import { useI18n } from '@/shared/i18n/I18nContext'
import { getMyProfile } from '@/features/user'
import { getRoomStatus } from '../api/roomApi'
import { ParticipantsPanel } from '../components/ParticipantsPanel'
import { ChatPanel } from '../components/ChatPanel'
import { RoomStage } from '../components/RoomStage'
import { RoomEndedOverlay } from '../components/RoomEndedOverlay'
import { HostRequestOverlay } from '../components/HostRequestOverlay'
import { useHostRequests } from '../hooks/useHostRequests'

interface RoomConnectionInfo {
    accessToken: string
    serverUrl: string
    roomName: string
    isHost: boolean
    camOn?: boolean
    micOn?: boolean
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
    className?: string
    style?: CSSProperties
    onDisconnected?: (reason?: DisconnectReason) => void
    children?: ReactNode
}

const TypedLiveKitRoom = LiveKitRoom as unknown as (props: LiveKitRoomCompatProps) => JSX.Element

export function MeetingRoomPage() {
    const { t } = useI18n()
    const { meetingId } = useParams<{ meetingId: string }>()
    const location = useLocation()
    const navigate = useNavigate()
    const passedState = location.state as RoomConnectionInfo | undefined

    const [connection, setConnection] = useState<RoomConnectionInfo | null>(passedState ?? null)
    const [error, setError] = useState<string | null>(null)
    const [panelOpen, setPanelOpen] = useState(false)
    const [chatOpen, setChatOpen] = useState(false)
    const [myPhotoUrl, setMyPhotoUrl] = useState<string | null>(null)
    const [title, setTitle] = useState('')
    const [publicId, setPublicId] = useState('')
    const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(false)
    // Не з власної волі розірвали з'єднання: конференцію завершили для всіх або вилучили саме мене.
    const [endedKind, setEndedKind] = useState<'ended' | 'removed' | null>(null)
    // Запити до організатора (кімната очікування + показ екрана) опитуємо один раз тут:
    // від цих даних залежать і лічильник на кнопці «Учасники», і спливаюче вікно, і панель.
    const requests = useHostRequests(meetingId, Boolean(connection?.isHost))

    // Фото профілю — для плейсхолдера власної плитки, коли камера вимкнена
    // (замість загальної іконки людини LiveKit за замовчуванням).
    useEffect(() => {
        getMyProfile().then((p) => setMyPhotoUrl(p.photoUrl)).catch(() => {})
    }, [])

    // Назва конференції — для верхньої панелі кімнати.
    useEffect(() => {
        if (!meetingId) return
        getRoomStatus(meetingId).then((r) => {
            setTitle(r.title)
            setPublicId(r.roomName)
            setWaitingRoomEnabled(r.waitingRoomEnabled)
        }).catch(() => {})
    }, [meetingId])

    // Теми/мови тепер у верхньому правому куті самої кімнати, тож на час перебування
    // в ній ховаємо глобальний плаваючий перемикач — інакше вийде дублювання.
    useEffect(() => {
        document.body.classList.add('in-room')
        return () => document.body.classList.remove('in-room')
    }, [])

    // Якщо сюди потрапили без стану переходу (наприклад, F5 посеред заняття) —
    // донабираємо дані через /status: уже допущений учасник лишається ADMITTED.
    // Камеру/мікрофон у цьому випадку безпечніше лишити вимкненими за замовчуванням.
    useEffect(() => {
        if (connection || !meetingId) return
        getRoomStatus(meetingId)
            .then((result) => {
                if (result.status === 'ADMITTED' && result.accessToken && result.serverUrl) {
                    setConnection({
                        accessToken: result.accessToken, serverUrl: result.serverUrl,
                        roomName: result.roomName, isHost: result.isHost, camOn: false, micOn: false,
                    })
                } else {
                    navigate('/')
                }
            })
            .catch((err) => {
                setError(err instanceof ApiError ? err.message : t('room.connectError'))
            })
    }, [connection, meetingId, navigate])

    if (error) return <main className="page"><p className="error">{error}</p></main>
    if (!connection) return <main className="page"><p>{t('room.connecting')}</p></main>

    return (
        <>
        <TypedLiveKitRoom
            token={connection.accessToken}
            serverUrl={connection.serverUrl}
            connect={!endedKind}
            video={Boolean(connection.camOn)}
            audio={Boolean(connection.micOn)}
            data-lk-theme="default"
            className={[myPhotoUrl ? 'local-has-avatar' : '', panelOpen || chatOpen ? 'has-sidebar' : ''].filter(Boolean).join(' ') || undefined}
            style={{
                height: '100vh',
                ...(myPhotoUrl ? ({ '--own-avatar-url': `url(${myPhotoUrl})` } as CSSProperties) : {}),
            }}
            onDisconnected={(reason) => {
                // Сам організатор, що завершив конференцію, переходить на головну сам (LeaveButton);
                // решті учасників показуємо оверлей замість мовчазного переходу.
                if (reason === DisconnectReason.ROOM_DELETED && !connection.isHost) setEndedKind('ended')
                else if (reason === DisconnectReason.PARTICIPANT_REMOVED) setEndedKind('removed')
                else navigate('/')
            }}
        >
            <RoomStage
                isHost={connection.isHost}
                meetingId={meetingId}
                title={title}
                publicId={publicId}
                waitingRoomEnabled={waitingRoomEnabled}
                requests={requests}
                panelOpen={panelOpen}
                chatOpen={chatOpen}
                onTogglePanel={() => setPanelOpen((o) => !o)}
                onToggleChat={() => setChatOpen((o) => !o)}
            />
            {connection.isHost && <HostRequestOverlay requests={requests} hidden={panelOpen} />}
            {(panelOpen || chatOpen) && (
                // Обидві панелі — в одному правому стовпці на третину ширини й на всю висоту;
                // якщо відкриті разом, кожна займає половину висоти.
                <div className="room-sidebar">
                    {meetingId && (
                        <ParticipantsPanel
                            meetingId={meetingId}
                            isHost={connection.isHost}
                            requests={requests}
                            open={panelOpen}
                            onClose={() => setPanelOpen(false)}
                        />
                    )}
                    <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
                </div>
            )}
        </TypedLiveKitRoom>
        {endedKind && <RoomEndedOverlay kind={endedKind} onHome={() => navigate('/')} />}
        </>
    )
}
