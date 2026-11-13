import * as React from 'react'
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core'
import { TrackLoop, usePagination } from '@livekit/components-react'

// Власні сітка й карусель замість GridLayout/CarouselLayout з LiveKit. Ті всередині
// пересортовують плитки за «хто говорить / хто з камерою» (useVisualStableUpdate) і
// ігнорують наш порядок — через це піднята рука не переносила учасника на початок.
// Тут плитки показуються рівно в тому порядку, у якому їх передали.

type TrackLoopCompat = (props: { tracks: TrackReferenceOrPlaceholder[]; children: React.ReactNode }) => JSX.Element
const TypedTrackLoop = TrackLoop as unknown as TrackLoopCompat

interface OrderedLayoutProps {
    tracks: TrackReferenceOrPlaceholder[]
    children: React.ReactNode
}

// Плитки завжди одного розміру (як у списку учасників): у кадр потрапляє стільки, скільки вміщається,
// решта — на наступних сторінках, між якими перемикають стрілки. Розмір не залежить від кількості учасників.
const TILE_W = 336
const TILE_H = 198
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

    // На дуже вузьких екранах плитка стискається до ширини екрана, зберігаючи пропорції.
    const tileW = Math.min(TILE_W, Math.max(140, size.w - GAP * 2))
    const tileH = Math.round((tileW * TILE_H) / TILE_W)
    const cols = Math.max(1, Math.floor((size.w + GAP) / (tileW + GAP)))
    const rows = Math.max(1, Math.floor((size.h + GAP) / (tileH + GAP)))
    const pagination = usePagination(cols * rows, tracks)
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
