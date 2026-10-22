import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createLocalAudioTrack, createLocalVideoTrack, LocalAudioTrack, LocalVideoTrack } from 'livekit-client'
import { ApiError } from '@/shared/api/http'
import { joinRoom } from '../api/roomApi'
import { DeviceSelect } from '../components/DeviceSelect'
import { MicLevelMeter } from '../components/MicLevelMeter'

interface PreJoinLocationState {
    publicId: string
    password: string
}

// Проміжний екран перед входом у кімнату: тут і організатор, і гість перевіряють
// камеру/мікрофон і лише після натискання «Приєднатися» ми фактично звертаємось
// до сервера. Раніше організатор минав цей крок і потрапляв у LiveKit одразу —
// це і є той баг, який тут виправлено: тепер прев'ю отримують обидві ролі однаково.
//
// Камера й мікрофон за замовчуванням ВИМКНЕНІ — доступ до пристрою запитується
// лише в момент, коли людина сама натискає «Увімкнути камеру/мікрофон», а не одразу
// при відкритті сторінки. Обраний стан (увімкнено/вимкнено) переноситься далі —
// або прямо в конференцію, або в кімнату очікування — щоб пристрої не "оживали"
// самі по собі після фактичного приєднання.
export function PreJoinLobby() {
    const location = useLocation()
    const navigate = useNavigate()
    const state = location.state as PreJoinLocationState | undefined
    const videoRef = useRef<HTMLVideoElement>(null)

    const [videoTrack, setVideoTrack] = useState<LocalVideoTrack | null>(null)
    const [audioTrack, setAudioTrack] = useState<LocalAudioTrack | null>(null)
    const [camOn, setCamOn] = useState(false)
    const [micOn, setMicOn] = useState(false)
    const [camDeviceId, setCamDeviceId] = useState<string>()
    const [micDeviceId, setMicDeviceId] = useState<string>()
    const [deviceError, setDeviceError] = useState<string | null>(null)
    const [joinError, setJoinError] = useState<string | null>(null)
    const [joining, setJoining] = useState(false)

    useEffect(() => {
        if (!state?.publicId) {
            navigate('/')
        }
    }, [state, navigate])

    // Зупиняємо пристрої, якщо людина просто закриє/залишить сторінку не приєднавшись.
    useEffect(() => {
        return () => {
            videoTrack?.stop()
            audioTrack?.stop()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function toggleCam() {
        setDeviceError(null)
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
            if (videoRef.current) track.attach(videoRef.current)
        } catch {
            setDeviceError('Не вдалося отримати доступ до камери')
        }
    }

    async function toggleMic() {
        setDeviceError(null)
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
            setDeviceError('Не вдалося отримати доступ до мікрофона')
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

    async function handleJoin() {
        if (!state?.publicId) return
        setJoinError(null)
        setJoining(true)
        try {
            const result = await joinRoom(state.publicId, state.password)
            // Прев'ю більше не потрібне — або переходимо в кімнату, або чекаємо організатора.
            videoTrack?.stop()
            audioTrack?.stop()
            if (result.status === 'ADMITTED') {
                navigate(`/room/${result.meetingId}`, {
                    state: {
                        accessToken: result.accessToken, serverUrl: result.serverUrl,
                        roomName: result.roomName, isHost: result.isHost, camOn, micOn,
                    },
                })
            } else {
                navigate(`/waiting/${result.meetingId}`, { state: { camOn, micOn } })
            }
        } catch (err) {
            setJoinError(err instanceof ApiError ? err.message : 'Не вдалося приєднатися до заняття')
            setJoining(false)
        }
    }

    return (
        <main className="page">
            <h1>Перевірка пристроїв</h1>
            {deviceError && <p className="error">{deviceError}</p>}
            {joinError && <p className="error">{joinError}</p>}
            <div className="preview-box">
                {camOn
                    ? <video ref={videoRef} autoPlay muted playsInline className="preview-video" />
                    : <div className="camera-off-note">Камера вимкнена</div>}
            </div>

            <div className="device-row">
                <button type="button" onClick={toggleCam}>{camOn ? 'Вимкнути камеру' : 'Увімкнути камеру'}</button>
                <DeviceSelect kind="videoinput" value={camDeviceId} onChange={handleCamDeviceChange} />
            </div>
            <div className="device-row">
                <button type="button" onClick={toggleMic}>{micOn ? 'Вимкнути мікрофон' : 'Увімкнути мікрофон'}</button>
                <DeviceSelect kind="audioinput" value={micDeviceId} onChange={handleMicDeviceChange} />
            </div>
            {micOn && <MicLevelMeter track={audioTrack} />}
            {micOn && <p className="hint">Скажіть щось — смужка вище має рухатись, якщо мікрофон працює.</p>}

            <p className="hint">Камера й мікрофон вимкнені за замовчуванням — увімкніть їх, якщо потрібно.</p>
            <div className="form-actions">
                <button type="button" className="btn-primary" onClick={handleJoin} disabled={joining}>
                    {joining ? 'Приєднання…' : 'Приєднатися'}
                </button>
            </div>
        </main>
    )
}
