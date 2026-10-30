import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { createLocalAudioTrack, createLocalVideoTrack, LocalAudioTrack, LocalVideoTrack } from 'livekit-client'
import { ApiError } from '@/shared/api/http'
import { useI18n } from '@/shared/i18n/I18nContext'
import { getRoomStatus, leaveWaitingRoom, RoomStatus } from '../api/roomApi'
import { DeviceSelect } from '../components/DeviceSelect'
import { MicLevelMeter } from '../components/MicLevelMeter'

interface WaitingLocationState {
    camOn?: boolean
    micOn?: boolean
}

export function WaitingRoomPage() {
    const { t } = useI18n()
    const { meetingId } = useParams<{ meetingId: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const initial = (location.state as WaitingLocationState | undefined) ?? {}
    const videoRef = useRef<HTMLVideoElement>(null)
    // Коли людина натискає "Скасувати", опитування статусу вже не повинне нікуди переводити —
    // навіть якщо відповідь від попереднього запиту прийде з запізненням.
    const leavingRef = useRef(false)

    const [videoTrack, setVideoTrack] = useState<LocalVideoTrack | null>(null)
    const [audioTrack, setAudioTrack] = useState<LocalAudioTrack | null>(null)
    const [camOn, setCamOn] = useState(false)
    const [micOn, setMicOn] = useState(false)
    const [camDeviceId, setCamDeviceId] = useState<string>()
    const [micDeviceId, setMicDeviceId] = useState<string>()
    const [status, setStatus] = useState<RoomStatus | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [leaving, setLeaving] = useState(false)

    // Кімната очікування — це водночас і місце, де людина налаштовує камеру/мікрофон,
    // поки чекає на організатора. За замовчуванням пристрої вимкнені; якщо вона вже
    // вмикала їх на попередньому екрані (PreJoinLobby) — продовжуємо з того самого стану.
    useEffect(() => {
        let cancelled = false

        async function setup() {
            if (initial.camOn) {
                try {
                    const track = await createLocalVideoTrack()
                    if (cancelled) { track.stop(); return }
                    setVideoTrack(track)
                    setCamOn(true)
                } catch {
                    setError(t('device.cameraError'))
                }
            }
            if (initial.micOn) {
                try {
                    const track = await createLocalAudioTrack()
                    if (cancelled) { track.stop(); return }
                    setAudioTrack(track)
                    setMicOn(true)
                } catch {
                    setError(t('device.micError'))
                }
            }
        }
        setup()

        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        return () => {
            videoTrack?.stop()
            audioTrack?.stop()
        }
    }, [videoTrack, audioTrack])

    // Той самий фікс, що й у PreJoinLobby: attach() викликаний одразу після setCamOn(true)
    // влучав у момент, коли <video> ще не змонтовано (попередній рендер мав camera-off-note),
    // тож videoRef.current був null і трек лишався ніде не прикріпленим. Ефект спрацьовує
    // вже після монтування <video>.
    useEffect(() => {
        if (videoTrack && videoRef.current) {
            videoTrack.attach(videoRef.current)
        }
        return () => {
            videoTrack?.detach()
        }
    }, [videoTrack])

    async function toggleCam() {
        if (camOn) {
            videoTrack?.stop()
            setVideoTrack(null)
            setCamOn(false)
            return
        }
        try {
            const track = await createLocalVideoTrack(camDeviceId ? { deviceId: camDeviceId } : undefined)
            setVideoTrack(track)
            setCamOn(true)
        } catch {
            setError(t('device.cameraError'))
        }
    }

    async function toggleMic() {
        if (micOn) {
            audioTrack?.stop()
            setAudioTrack(null)
            setMicOn(false)
            return
        }
        try {
            const track = await createLocalAudioTrack(micDeviceId ? { deviceId: micDeviceId } : undefined)
            setAudioTrack(track)
            setMicOn(true)
        } catch {
            setError(t('device.micError'))
        }
    }

    async function handleCamDeviceChange(deviceId: string) {
        setCamDeviceId(deviceId)
        if (videoTrack) {
            await videoTrack.restartTrack({ deviceId })
        }
    }

    async function handleMicDeviceChange(deviceId: string) {
        setMicDeviceId(deviceId)
        if (audioTrack) {
            await audioTrack.restartTrack({ deviceId })
        }
    }

    async function handleCancel() {
        leavingRef.current = true
        setLeaving(true)
        videoTrack?.stop()
        audioTrack?.stop()
        if (meetingId) {
            try {
                await leaveWaitingRoom(meetingId)
            } catch {
                // Навіть якщо запит не пройшов (наприклад, організатор уже встиг щось змінити) —
                // людина все одно хотіла піти, тож просто повертаємо її на головну.
            }
        }
        navigate('/')
    }

    // Опитування статусу кожні 2 секунди — те саме рішення (polling), яке ми обрали раніше.
    useEffect(() => {
        if (!meetingId) return
        let active = true

        async function poll() {
            try {
                const result = await getRoomStatus(meetingId!)
                if (!active || leavingRef.current) return
                setStatus(result)
                if (result.status === 'ADMITTED') {
                    videoTrack?.stop()
                    audioTrack?.stop()
                    navigate(`/room/${meetingId}`, {
                        state: {
                            accessToken: result.accessToken, serverUrl: result.serverUrl,
                            roomName: result.roomName, isHost: result.isHost, camOn, micOn,
                        },
                    })
                } else if (result.status === 'DENIED') {
                    setError(t('waitingRoom.deniedError'))
                }
            } catch (err) {
                if (!leavingRef.current) {
                    setError(err instanceof ApiError ? err.message : t('waitingRoom.statusError'))
                }
            }
        }

        poll()
        const interval = setInterval(poll, 2000)
        return () => { active = false; clearInterval(interval) }
    }, [meetingId, navigate, videoTrack, audioTrack, camOn, micOn])

    return (
        <main className="page-media">
            <h1>{t('waitingRoom.title')}</h1>
            {error && <p className="error">{error}</p>}
            <div className="preview-box">
                {camOn
                    ? <video ref={videoRef} autoPlay muted playsInline className="preview-video" />
                    : <div className="camera-off-note">{t('device.cameraOff')}</div>}
            </div>

            <div className="device-row">
                <button type="button" onClick={toggleCam}>{camOn ? t('device.cameraTurnOff') : t('device.cameraOn')}</button>
                <DeviceSelect kind="videoinput" value={camDeviceId} onChange={handleCamDeviceChange} />
            </div>
            <div className="device-row">
                <button type="button" onClick={toggleMic}>{micOn ? t('device.micTurnOff') : t('device.micOn')}</button>
                <DeviceSelect kind="audioinput" value={micDeviceId} onChange={handleMicDeviceChange} />
            </div>
            {micOn && <MicLevelMeter track={audioTrack} />}
            {micOn && <p className="hint">{t('device.micHint')}</p>}

            <p className="hint">
                {status?.roomName && <>{t('waitingRoom.meetingLabel')} <strong>{status.roomName}</strong><br /></>}
                {t('waitingRoom.statusHint')}
            </p>

            <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleCancel} disabled={leaving}>
                    {leaving ? t('waitingRoom.leaving') : t('waitingRoom.cancel')}
                </button>
            </div>
        </main>
    )
}
