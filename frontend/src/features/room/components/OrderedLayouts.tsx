import * as React from 'react'
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core'
import { TrackLoop } from '@livekit/components-react'

// Власні сітка й карусель замість GridLayout/CarouselLayout з LiveKit. Ті всередині
// пересортовують плитки за «хто говорить / хто з камерою» (useVisualStableUpdate) і
// ігнорують наш порядок — через це піднята рука не переносила учасника на початок.
// Тут плитки показуються рівно в тому порядку, у якому їх передали.

type TrackLoopCompat = (props: { tracks: TrackReferenceOrPlaceholder[]; children: React.ReactNode }) => JSX.Element
const TypedTrackLoop = TrackLoop as unknown as TrackLoopCompat

// Власна пагінація замість usePagination з LiveKit: той усередині викликає useVisualStableUpdate,
// який знову переставляє плитки («хто говорить / хто з камерою» — на першу сторінку) і тим
// скасовує наш порядок, зокрема чергу піднятих рук. Тут порядок лишається таким, яким його передали.
function useOrderedPagination(itemsPerPage: number, tracks: TrackReferenceOrPlaceholder[]) {
    const [page, setPage] = React.useState(1)
    const totalPageCount = Math.max(Math.ceil(tracks.length / itemsPerPage), 1)
    const currentPage = Math.min(page, totalPageCount)
    const first = (currentPage - 1) * itemsPerPage
    return {
        totalPageCount,
        currentPage,
        tracks: tracks.slice(first, first + itemsPerPage),
        prevPage: () => setPage(Math.max(currentPage - 1, 1)),
        nextPage: () => setPage(Math.min(currentPage + 1, totalPageCount)),
    }
}

interface OrderedLayoutProps {
    tracks: TrackReferenceOrPlaceholder[]
    children: React.ReactNode
}

// Плитки в сітці однакового розміру, але він підлаштовується під екран: на вузькому — 1–2 колонки,
// на широкому — не більше MAX_COLS колонок і MAX_ROWS рядків, а плитки стають більшими, а не
// множаться (на великому моніторі 30 дрібних плиток незручні). Що не вмістилося — на наступних
// сторінках, між якими перемикають стрілки.
const TILE_ASPECT = 336 / 198
const MIN_TILE_W = 300   // вужче — зменшуємо кількість колонок
const MAX_TILE_W = 560
const MAX_COLS = 4
const MAX_ROWS = 3
const GAP = 12

export function OrderedGrid({ tracks, children }: OrderedLayoutProps) {
    const frameEl = React.useRef<HTMLDivElement>(null)
    const [size, setSize] = React.useState({ w: 0, h: 0 })

    React.useEffect(() => {
        const el = frameEl.current
        if (!el) return
        const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
        update()
        const observer = new ResizeObserver(update)
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const cols = Math.max(1, Math.min(MAX_COLS, Math.floor((size.w + GAP) / (MIN_TILE_W + GAP))))
    let tileW = Math.min(MAX_TILE_W, Math.max(140, Math.floor((size.w - GAP * (cols - 1)) / cols)))
    let tileH = Math.round(tileW / TILE_ASPECT)
    // Якщо навіть один ряд не вміщається по висоті — зменшуємо плитку, зберігаючи пропорції.
    if (size.h > 0 && tileH > size.h - GAP) {
        tileH = Math.max(100, size.h - GAP)
        tileW = Math.round(tileH * TILE_ASPECT)
    }
    const rows = Math.max(1, Math.min(MAX_ROWS, Math.floor((size.h + GAP) / (tileH + GAP))))
    const pagination = useOrderedPagination(cols * rows, tracks)
    const paged = pagination.totalPageCount > 1

    return (
        <div ref={frameEl} className="room-grid-frame">
            <div
                className="room-grid"
                style={{ gridTemplateColumns: `repeat(${cols}, ${tileW}px)`, gridAutoRows: `${tileH}px`, gap: `${GAP}px` }}
            >
                <TypedTrackLoop tracks={pagination.tracks}>{children}</TypedTrackLoop>
            </div>
            {paged && (
                <>
                    <button type="button" className="room-grid-arrow room-grid-arrow-prev" onClick={pagination.prevPage} aria-label="←">‹</button>
                    <button type="button" className="room-grid-arrow room-grid-arrow-next" onClick={pagination.nextPage} aria-label="→">›</button>
                    <span className="room-grid-count">{`${pagination.currentPage} / ${pagination.totalPageCount}`}</span>
                </>
            )}
        </div>
    )
}

function useNarrowScreen(): boolean {
    const [narrow, setNarrow] = React.useState(() => window.matchMedia('(max-width: 600px)').matches)
    React.useEffect(() => {
        const mq = window.matchMedia('(max-width: 600px)')
        const onChange = () => setNarrow(mq.matches)
        mq.addEventListener('change', onChange)
        return () => mq.removeEventListener('change', onChange)
    }, [])
    return narrow
}

// Мініатюри збоку (або зверху на вузьких екранах): розмір плиток задає CSS, див. livekit-theme.css.
export function OrderedCarousel({ tracks, children }: OrderedLayoutProps) {
    const narrow = useNarrowScreen()
    return (
        <aside className="lk-carousel" data-lk-orientation={narrow ? 'horizontal' : 'vertical'}>
            <TypedTrackLoop tracks={tracks}>{children}</TypedTrackLoop>
        </aside>
    )
}
