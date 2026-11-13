import type { ReactNode } from 'react'
// Маленькі лінійні іконки для статусів мікрофона/камери — заміна емодзі
// (🎤/🔇/📹/📷), які на різних платформах рендеряться дуже по-різному
// і візуально випадали зі стилю застосунку.

interface IconProps {
    className?: string
}

export function MicIcon({ className }: IconProps) {
    return (
        <Svg className={className} size={14}>
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <line x1="12" y1="18" x2="12" y2="22" />
        </Svg>
    )
}

export function MicOffIcon({ className }: IconProps) {
    return (
        <Svg className={className} size={14}>
            <path d="M9 9v3a3 3 0 0 0 4.6 2.55" />
            <path d="M15 5.5A3 3 0 0 0 9 7v1" />
            <path d="M5 11a7 7 0 0 0 10.3 6.15" />
            <path d="M19 11a7 7 0 0 1-1.1 3.75" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="3" y1="3" x2="21" y2="21" />
        </Svg>
    )
}

export function CameraIcon({ className }: IconProps) {
    return (
        <Svg className={className} size={14}>
            <rect x="2" y="6" width="14" height="12" rx="2.5" />
            <path d="M16 10.5 22 7v10l-6-3.5" />
        </Svg>
    )
}

export function CameraOffIcon({ className }: IconProps) {
    return (
        <Svg className={className} size={14}>
            <path d="M16 10.5 22 7v10l-6-3.5" />
            <path d="M2 8.5V16a2 2 0 0 0 2 2h8" />
            <path d="M14 6H4a2 2 0 0 0-2 2" />
            <line x1="2" y1="2" x2="22" y2="22" />
        </Svg>
    )
}


// Іконки нижньої/верхньої панелі кімнати зустрічі (розмір 16, як у кнопок LiveKit).
interface SizedIconProps extends IconProps {
    size?: number
}

// Усі іконки застосунку мають однакову товщину лінії в пікселях (як у кошика й редагування) незалежно від розміру:
// strokeWidth задається в одиницях viewBox 24×24, тож перераховуємо його з розміру іконки.
const ICON_STROKE_PX = 1.0

function Svg({ className, size = 16, children }: SizedIconProps & { children: ReactNode }) {
    return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={(ICON_STROKE_PX * 24) / size} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

// Тема: тонкі контурні місяць і сонце (показуємо ту, на яку перемкнемось).
export function MoonIcon(props: SizedIconProps) {
    return (
        <Svg {...props}>
            <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        </Svg>
    )
}

export function SunIcon(props: SizedIconProps) {
    return (
        <Svg {...props}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </Svg>
    )
}

// Редагувати / видалити: контурні (без заливки) лінії завтовшки ~1px.
export function EditIcon(props: SizedIconProps) {
    return (
        <Svg {...props}>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </Svg>
    )
}

export function TrashIcon(props: SizedIconProps) {
    return (
        <Svg {...props}>
            <path d="M3 6h18" />
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
        </Svg>
    )
}

// Повторюване заняття (контурні стрілки по колу, ~1px).
export function RepeatIcon(props: SizedIconProps) {
    return (
        <Svg {...props}>
            <path d="m17 2 4 4-4 4" />
            <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
            <path d="m7 22-4-4 4-4" />
            <path d="M21 13v1a4 4 0 0 1-4 4H3" />
        </Svg>
    )
}

// Реакції (lucide "smile").
export function SmileIcon(props: SizedIconProps) {
    return (
        <Svg {...props}>
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
        </Svg>
    )
}

// Опитування (lucide "bar-chart-horizontal").
export function PollIcon(props: SizedIconProps) {
    return (
        <Svg {...props}>
            <path d="M3 3v18h18" />
            <rect x="7" y="13" width="9" height="4" rx="1" />
            <rect x="7" y="6" width="13" height="4" rx="1" />
        </Svg>
    )
}


export function LockIcon(props: SizedIconProps) {
    return (
        <Svg {...props}>
            <rect x="4" y="11" width="16" height="10" rx="2.5" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </Svg>
    )
}

export function ImageIcon(props: SizedIconProps) {
    return (
        <Svg {...props}>
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <circle cx="9" cy="10" r="1.6" />
            <path d="m21 16-5-5-9 9" />
        </Svg>
    )
}

export function PhotoCameraIcon(props: SizedIconProps) {
    return (
        <Svg {...props}>
            <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
            <circle cx="12" cy="13" r="3.5" />
        </Svg>
    )
}
