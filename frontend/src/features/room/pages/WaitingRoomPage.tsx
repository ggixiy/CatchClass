import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createLocalAudioTrack, createLocalVideoTrack, LocalAudioTrack, LocalVideoTrack } from 'livekit-client'
import { ApiError } from '@/shared/api/http'
import { getRoomStatus, RoomStatus } from '../api/roomApi'

export function WaitingRoomPage() {
    const { meetingId } = useParams<{ meetingId: string }>()
    const navigate = useNavigate()
    const videoRef = useRef<HTMLVideoElement>(null)

    const [videoTrack, setVideoTrack] = useState<LocalVideoTrack | null>(null)
    const [audioTrack, setAudioTrack] = useState<LocalAudioTrack | null>(null)
    const [camOn, setCamOn] = useState(true)
    const [micOn, setMicOn] = useState(true)
    const [status, setStatus] = useState<RoomStatus | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Прев'ю живе само по собі, без підключення до LiveKit-кімнати — лише локальний
    // доступ до камери/мікрофона браузера, щоб людина могла перевірити пристрої заздалегідь.
    useEffect(() => {
        let cancelled = false
        let localVideo: LocalVideoTrack | null = null
        let localAudio: LocalAudioTrack | null = null

        async function setup() {
            try {
                localVideo = await createLocalVideoTrack()
                localAudio = await createLocalAudioTrack()
                if (cancelled) {
                    localVideo.stop()
                    localAudio.stop()
                    return
                }
                setVideoTrack(localVideo)
                setAudioTrack(localAudio)
                if (videoRef.current) {
                    localVideo.attach(videoRef.current)
                }
            } catch {
                setError('Не вдалося отримати доступ до камери або мікрофона')
            }
        }
        setup()

        return () => {
            cancelled = true
            localVideo?.stop()
            localAudio?.stop()
        }
    }, [])

    function toggleCam() {
        if (!videoTrack) return
        if (camOn) videoTrack.mute(); else videoTrack.unmute()
        setCamOn(!camOn)
    }

    function toggleMic() {
        if (!audioTrack) return
        if (micOn) audioTrack.mute(); else audioTrack.unmute()
        setMicOn(!micOn)
    }

    // Опитування статусу кожні 2 секунди — те саме рішення (polling), яке ми обрали раніше.
    useEffect(() => {
        if (!meetingId) return
        let active = true

        async function poll() {
            try {
                const result = await getRoomStatus(meetingId!)
                if (!active) return
                setStatus(result)
                if (result.status === 'ADMITTED') {
                    videoTrack?.stop()
                    audioTrack?.stop()
                    navigate(`/room/${meetingId}`, {
                        state: { accessToken: result.accessToken, serverUrl: result.serverUrl, roomName: result.roomName },
                    })
                } else if (result.status === 'DENIED') {
                    setError('Організатор відхилив запит на приєднання')
                }
            } catch (err) {
                setError(err instanceof ApiError ? err.message : 'Не вдалося перевірити статус заняття')
            }
        }

        poll()
        const interval = setInterval(poll, 2000)
        return () => { active = false; clearInterval(interval) }
    }, [meetingId, navigate, videoTrack, audioTrack])

    return (
        <main className="page">
            <h1>Кімната очікування</h1>
            {error && <p className="error">{error}</p>}
            <div className="preview-box">
                <video ref={videoRef} autoPlay muted playsInline className="preview-video" />
            </div>
            <div className="form-actions">
                <button type="button" onClick={toggleCam}>{camOn ? 'Вимкнути камеру' : 'Увімкнути камеру'}</button>
                <button type="button" onClick={toggleMic}>{micOn ? 'Вимкнути мікрофон' : 'Увімкнути мікрофон'}</button>
            </div>
            <p className="hint">
                {status?.roomName && <>Заняття: <strong>{status.roomName}</strong><br /></>}
                Очікуємо, поки організатор допустить вас до заняття…
            </p>
        </main>
    )
}