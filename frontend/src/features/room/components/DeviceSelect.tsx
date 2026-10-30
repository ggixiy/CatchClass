import { useEffect, useState } from 'react'
import { useI18n } from '@/shared/i18n/I18nContext'

interface DeviceSelectProps {
    kind: 'audioinput' | 'videoinput'
    value: string | undefined
    onChange: (deviceId: string) => void
}

// Дає обрати конкретну камеру/мікрофон, якщо їх декілька. Список пристроїв стає
// з нормальними назвами (а не "Camera 1") лише після того, як браузер уже видав
// дозвіл на доступ хоча б один раз у цій вкладці — це штатна поведінка браузера.
export function DeviceSelect({ kind, value, onChange }: DeviceSelectProps) {
    const { t } = useI18n()
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([])

    useEffect(() => {
        let active = true
        navigator.mediaDevices?.enumerateDevices()
            .then((list) => {
                if (active) setDevices(list.filter((d) => d.kind === kind))
            })
            .catch(() => {})
        return () => { active = false }
    }, [kind])

    if (devices.length < 2) return null

    const label = kind === 'videoinput' ? t('device.camera') : t('device.microphone')

    return (
        <select
            className="device-select"
            value={value ?? devices[0]?.deviceId ?? ''}
            onChange={(e) => onChange(e.target.value)}
        >
            {devices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `${label} ${i + 1}`}
                </option>
            ))}
        </select>
    )
}
