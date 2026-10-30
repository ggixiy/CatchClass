import { useEffect, useRef, useState } from 'react'
import { LocalAudioTrack } from 'livekit-client'
import { useI18n } from '@/shared/i18n/I18nContext'

interface MicLevelMeterProps {
    track: LocalAudioTrack | null
}

// Візуальний тест мікрофона: смужка реагує на реальний звук з пристрою
// (через Web Audio AnalyserNode), а не просто показує "увімкнено/вимкнено".
// Так людина бачить, що мікрофон і справді щось чує, перш ніж заходити на заняття.
export function MicLevelMeter({ track }: MicLevelMeterProps) {
    const { t } = useI18n()
    const [level, setLevel] = useState(0)
    const rafRef = useRef<number>()

    useEffect(() => {
        const mediaTrack = track?.mediaStreamTrack
        if (!mediaTrack) {
            setLevel(0)
            return
        }

        const audioContext = new AudioContext()
        const source = audioContext.createMediaStreamSource(new MediaStream([mediaTrack]))
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        const data = new Uint8Array(analyser.frequencyBinCount)

        function tick() {
            analyser.getByteTimeDomainData(data)
            // RMS відхилення від середини (128) — проста й стабільна міра гучності.
            let sumSquares = 0
            for (let i = 0; i < data.length; i++) {
                const v = (data[i] - 128) / 128
                sumSquares += v * v
            }
            const rms = Math.sqrt(sumSquares / data.length)
            setLevel(Math.min(1, rms * 4)) // підсилюємо — звичайна мова дає невелике RMS
            rafRef.current = requestAnimationFrame(tick)
        }
        tick()

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            source.disconnect()
            audioContext.close().catch(() => {})
        }
        // mediaTrack міняється щоразу, коли вмикаємо мік заново або перемикаємо пристрій.
    }, [track, track?.mediaStreamTrack])

    return (
        <div className="mic-level-meter" title={t('device.micLevelTitle')}>
            <div className="mic-level-fill" style={{ width: `${Math.round(level * 100)}%` }} />
        </div>
    )
}
