import { KeyboardEvent, useEffect, useRef, useState } from 'react'

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
    const selected = options.find((o) => o.value === value) ?? options[0]

    useEffect(() => {
        if (!open) return
        function onDown(e: MouseEvent) {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onDown)
        return () => document.removeEventListener('mousedown', onDown)
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
                {open && (
                    <ul className="select-list" role="listbox">
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
                    </ul>
                )}
            </div>
        </div>
    )
}
