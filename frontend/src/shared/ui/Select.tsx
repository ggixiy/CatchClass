import { KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export interface SelectOption {
    value: string
    label: string
}

interface SelectProps {
    value: string
    options: SelectOption[]
    onChange: (value: string) => void
    /** Підпис над полем (необов'язково). */
    label?: string
    className?: string
}

// Власний випадаючий список замість нативного <select>: список відкривається в стилі застосунку
// (нативне меню браузера стилізувати не можна). Підтримує мишу та клавіатуру (↑ ↓ Enter Esc).
export function Select({ value, options, onChange, label, className = '' }: SelectProps) {
    const [open, setOpen] = useState(false)
    const [active, setActive] = useState(0)
    const wrapRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const listRef = useRef<HTMLUListElement>(null)
    const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)
    const selected = options.find((o) => o.value === value) ?? options[0]

    useEffect(() => {
        if (!open) return
        function onDown(e: MouseEvent) {
            const target = e.target as Node
            if (wrapRef.current?.contains(target) || listRef.current?.contains(target)) return
            setOpen(false)
        }
        document.addEventListener('mousedown', onDown)
        return () => document.removeEventListener('mousedown', onDown)
    }, [open])

    // Список рендериться поверх сторінки (portal) і позиціонується за полем: його не обрізають
    // батьківські контейнери (модальні вікна, блоки з overflow) і він не змінює висоту сторінки.
    useLayoutEffect(() => {
        if (!open) return
        function place() {
            const r = triggerRef.current?.getBoundingClientRect()
            if (!r) return
            const h = listRef.current?.offsetHeight ?? 0
            const below = window.innerHeight - r.bottom - 8
            const top = below >= h || r.top < h ? r.bottom + 6 : r.top - h - 6
            setPos({ top, left: r.left, width: r.width })
        }
        place()
        window.addEventListener('resize', place)
        window.addEventListener('scroll', place, true)
        return () => {
            window.removeEventListener('resize', place)
            window.removeEventListener('scroll', place, true)
        }
    }, [open])

    function openList() {
        setActive(Math.max(0, options.findIndex((o) => o.value === value)))
        setOpen(true)
    }

    function choose(option: SelectOption) {
        onChange(option.value)
        setOpen(false)
    }

    function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape' && open) {
            e.stopPropagation()
            setOpen(false)
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (!open) openList()
            else setActive((i) => Math.min(options.length - 1, i + 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (!open) openList()
            else setActive((i) => Math.max(0, i - 1))
        } else if ((e.key === 'Enter' || e.key === ' ') && open) {
            e.preventDefault()
            choose(options[active])
        }
    }

    return (
        <div className={`select-field ${className}`} ref={wrapRef} onKeyDown={onKeyDown}>
            {label && <span className="select-label">{label}</span>}
            <div className="select-wrap">
                <button
                    ref={triggerRef}
                    type="button"
                    className="select-trigger"
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    onClick={() => (open ? setOpen(false) : openList())}
                >
                    <span className="select-value">{selected?.label}</span>
                    <svg className="select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </button>
                {open && createPortal(
                    <ul className="select-list" role="listbox" ref={listRef}
                        style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, width: pos?.width, visibility: pos ? 'visible' : 'hidden' }}>
                        {options.map((o, i) => (
                            <li
                                key={o.value}
                                role="option"
                                aria-selected={o.value === value}
                                className={`select-option${o.value === value ? ' selected' : ''}${i === active ? ' active' : ''}`}
                                onMouseEnter={() => setActive(i)}
                                onClick={() => choose(o)}
                            >
                                {o.label}
                            </li>
                        ))}
                    </ul>,
                    document.body,
                )}
            </div>
        </div>
    )
}
