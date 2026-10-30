import type { ReactNode } from 'react'
// Маленькі лінійні іконки для статусів мікрофона/камери — заміна емодзі
// (🎤/🔇/📹/📷), які на різних платформах рендеряться дуже по-різному
// і візуально випадали зі стилю застосунку.

interface IconProps {
    className?: string
}

export function MicIcon({ className }: IconProps) {
    return (
        <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <line x1="12" y1="18" x2="12" y2="22" />
        </svg>
    )
}

export function MicOffIcon({ className }: IconProps) {
    return (
        <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 9v3a3 3 0 0 0 4.6 2.55" />
            <path d="M15 5.5A3 3 0 0 0 9 7v1" />
            <path d="M5 11a7 7 0 0 0 10.3 6.15" />
            <path d="M19 11a7 7 0 0 1-1.1 3.75" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="3" y1="3" x2="21" y2="21" />
        </svg>
    )
}

export function CameraIcon({ className }: IconProps) {
    return (
        <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="14" height="12" rx="2.5" />
            <path d="M16 10.5 22 7v10l-6-3.5" />
        </svg>
    )
}

export function CameraOffIcon({ className }: IconProps) {
    return (
        <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 10.5 22 7v10l-6-3.5" />
            <path d="M2 8.5V16a2 2 0 0 0 2 2h8" />
            <path d="M14 6H4a2 2 0 0 0-2 2" />
            <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
    )
}


// Іконки нижньої/верхньої панелі кімнати зустрічі (розмір 16, як у кнопок LiveKit).
interface SizedIconProps extends IconProps {
    size?: number
}

function Svg({ className, size = 16, children }: SizedIconProps & { children: ReactNode }) {
    return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {children}
        </svg>
    )
}

// Піднята рука (lucide "hand").
export function HandIcon(props: SizedIconProps) {
    return (
        <Svg {...props}>
            <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
            <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
            <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </Svg>
    )
}

export function ChatIcon(props: SizedIconProps) {
    return (
        <Svg {...props}>
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
        </Svg>
    )
}

export function UsersIcon(props: SizedIconProps) {
    return (
        <Svg {...props}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </Svg>
    )
}

export function ScreenShareIcon(props: SizedIconProps) {
    return (
        <Svg {...props}>
            <rect x="2" y="4" width="20" height="13" rx="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
        </Svg>
    )
}

export function LeaveIcon(props: SizedIconProps) {
    return (
        <Svg {...props}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
        </Svg>
    )
}

export function MicLockedIcon(props: SizedIconProps) {
    return (
        <Svg {...props}>
            <path d="M9 9v3a3 3 0 0 0 4.6 2.55" />
            <path d="M15 5.5A3 3 0 0 0 9 7v1" />
            <path d="M5 11a7 7 0 0 0 10.3 6.15" />
            <path d="M19 11a7 7 0 0 1-1.1 3.75" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="3" y1="3" x2="21" y2="21" />
        </Svg>
    )
}
