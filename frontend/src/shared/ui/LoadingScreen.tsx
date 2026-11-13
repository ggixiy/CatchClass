import { useEffect, useRef } from 'react'

interface LoadingScreenProps {
    /** true — завантаження завершене; екран зникає, пропрацювавши щонайменше MIN_VISIBLE мс. */
    done: boolean
    onDone: () => void
    label: string
}

const MIN_VISIBLE = 600

// Екран завантаження: лише спокійний напис і тонка смуга, що ковзає.
export function LoadingScreen({ done, onDone, label }: LoadingScreenProps) {
    const shownAt = useRef(performance.now())

    useEffect(() => {
        if (!done) return
        const left = Math.max(0, MIN_VISIBLE - (performance.now() - shownAt.current))
        const id = window.setTimeout(onDone, left)
        return () => window.clearTimeout(id)
    }, [done, onDone])

    return (
        <div className="loading-screen" role="status" aria-live="polite">
            <p className="loading-label">{label}</p>
            <span className="loading-line" aria-hidden="true" />
        </div>
    )
}
