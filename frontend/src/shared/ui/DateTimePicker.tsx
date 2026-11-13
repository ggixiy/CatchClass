import { KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '@/shared/i18n/I18nContext'

interface Props {
    /** Формат як у datetime-local: YYYY-MM-DDTHH:mm (порожній рядок — не вибрано). */
    value: string
    onChange: (value: string) => void
    label?: string
    className?: string
    clearable?: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function parse(value: string) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value)
    if (!m) return null
    return { y: +m[1], mo: +m[2] - 1, d: +m[3], h: +m[4], mi: +m[5] }
}

// Власний вибір дати й часу замість нативного <input type="datetime-local">:
// нативний календар браузера стилізувати не можна, тож тут той самий вигляд, що в Select.
export function DateTimePicker({ value, onChange, label, className = '', clearable = false }: Props) {
    const { locale } = useI18n()
    const tag = locale === 'uk' ? 'uk-UA' : 'en-GB'
    const parsed = parse(value)
    const today = new Date()
    const [open, setOpen] = useState(false)
    const [view, setView] = useState({ y: parsed?.y ?? today.getFullYear(), mo: parsed?.mo ?? today.getMonth() })
    const wrapRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const popRef = useRef<HTMLDivElement>(null)
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

    useEffect(() => {
        if (!open) return
        function onDown(e: MouseEvent) {
            const target = e.target as Node
            if (wrapRef.current?.contains(target) || popRef.current?.contains(target)) return
            setOpen(false)
        }
        document.addEventListener('mousedown', onDown)
        return () => document.removeEventListener('mousedown', onDown)
    }, [open])

    // Календар рендериться поверх усієї сторінки (portal) і позиціонується відносно поля,
    // тому не розтягує й не прокручує модальне вікно, у якому стоїть.
    useLayoutEffect(() => {
        if (!open) return
        function place() {
            const r = triggerRef.current?.getBoundingClientRect()
            const h = popRef.current?.offsetHeight ?? 0
            const w = popRef.current?.offsetWidth ?? 0
            if (!r) return
            const below = window.innerHeight - r.bottom - 8
            const top = below >= h || r.top < h ? r.bottom + 6 : r.top - h - 6
            setPos({ top: Math.max(8, Math.min(top, window.innerHeight - h - 8)), left: Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) })
        }
        place()
        window.addEventListener('resize', place)
        window.addEventListener('scroll', place, true)
        return () => {
            window.removeEventListener('resize', place)
            window.removeEventListener('scroll', place, true)
        }
    }, [open, view])

    function emit(next: { y: number; mo: number; d: number; h: number; mi: number }) {
        onChange(`${next.y}-${pad(next.mo + 1)}-${pad(next.d)}T${pad(next.h)}:${pad(next.mi)}`)
    }

    function toggle() {
        if (!open) {
            const p = parse(value)
            if (p) setView({ y: p.y, mo: p.mo })
        }
        setOpen((o) => !o)
    }

    function shiftMonth(delta: number) {
        setView((v) => {
            const d = new Date(v.y, v.mo + delta, 1)
            return { y: d.getFullYear(), mo: d.getMonth() }
        })
    }

    function pickDay(d: number) {
        const base = parsed ?? { h: 9, mi: 0 }
        emit({ y: view.y, mo: view.mo, d, h: base.h, mi: base.mi })
    }

    function pickTime(part: 'h' | 'mi', v: number) {
        const base = parsed ?? { y: view.y, mo: view.mo, d: today.getDate(), h: 9, mi: 0 }
        emit({ ...base, [part]: v })
    }

    function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape' && open) {
            e.stopPropagation()
            setOpen(false)
        }
    }

    // Сітка місяця: тиждень починається з понеділка.
    const first = new Date(view.y, view.mo, 1)
    const offset = (first.getDay() + 6) % 7
    const daysInMonth = new Date(view.y, view.mo + 1, 0).getDate()
    const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
    const weekdays = Array.from({ length: 7 }, (_, i) =>
        new Date(2024, 0, 1 + i).toLocaleDateString(tag, { weekday: 'short' }))
    const monthName = first.toLocaleDateString(tag, { month: 'long' })
    const monthTitle = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${view.y}`

    const display = parsed
        ? `${new Date(parsed.y, parsed.mo, parsed.d).toLocaleDateString(tag, { day: 'numeric', month: 'long', year: 'numeric' })}, ${pad(parsed.h)}:${pad(parsed.mi)}`
        : '—'
    const isSelected = (d: number) => parsed && parsed.y === view.y && parsed.mo === view.mo && parsed.d === d
    const isToday = (d: number) => today.getFullYear() === view.y && today.getMonth() === view.mo && today.getDate() === d

    return (
        <div className={`select-field ${className}`} ref={wrapRef} onKeyDown={onKeyDown}>
            {label && <span className="select-label">{label}</span>}
            <div className="select-wrap">
                <button ref={triggerRef} type="button" className="select-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={toggle}>
                    <span className="select-value">{display}</span>
                    <svg className="select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="5" width="18" height="16" rx="2" />
                        <path d="M3 10h18M8 3v4M16 3v4" />
                    </svg>
                </button>
                {open && createPortal(
                    <div className="dtp-popover" role="dialog" ref={popRef} style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden' }}>
                        <div className="dtp-body">
                            <div className="dtp-calendar">
                                <div className="dtp-head">
                                    <button type="button" className="dtp-nav" onClick={() => shiftMonth(-1)} aria-label="‹">‹</button>
                                    <strong className="dtp-month">{monthTitle}</strong>
                                    <button type="button" className="dtp-nav" onClick={() => shiftMonth(1)} aria-label="›">›</button>
                                </div>
                                <div className="dtp-grid">
                                    {weekdays.map((w) => <span key={w} className="dtp-weekday">{w}</span>)}
                                    {cells.map((d, i) => d === null ? <span key={`e${i}`} /> : (
                                        <button
                                            key={d} type="button"
                                            className={`dtp-day${isSelected(d) ? ' selected' : ''}${isToday(d) ? ' today' : ''}`}
                                            onClick={() => pickDay(d)}
                                        >{d}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="dtp-side">
                                <div className="dtp-time">
                                    <div className="dtp-col">
                                        {HOURS.map((h) => (
                                            <button key={h} type="button" className={`dtp-opt${parsed?.h === h ? ' selected' : ''}`} onClick={() => pickTime('h', h)}>{pad(h)}</button>
                                        ))}
                                    </div>
                                    <span className="dtp-colon">:</span>
                                    <div className="dtp-col">
                                        {MINUTES.map((m) => (
                                            <button key={m} type="button" className={`dtp-opt${parsed?.mi === m ? ' selected' : ''}`} onClick={() => pickTime('mi', m)}>{pad(m)}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="dtp-foot">
                                    {clearable && value && <button type="button" onClick={() => { onChange(''); setOpen(false) }}>×</button>}
                                    <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>OK</button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
            </div>
        </div>
    )
}
