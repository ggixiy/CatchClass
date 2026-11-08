import * as React from 'react'
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core'
import { TrackLoop, useGridLayout, usePagination } from '@livekit/components-react'

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

export function OrderedGrid({ tracks, children }: OrderedLayoutProps) {
    const gridEl = React.useRef<HTMLDivElement>(null)
    const { layout } = useGridLayout(gridEl, tracks.length)
    const pagination = usePagination(layout.maxTiles, tracks)
    const paged = pagination.totalPageCount > 1

    return (
        <>
            <div ref={gridEl} className="lk-grid-layout" data-lk-pagination={paged}>
                <TypedTrackLoop tracks={pagination.tracks}>{children}</TypedTrackLoop>
            </div>
            {paged && (
                <div className="lk-pagination-control" data-lk-user-interaction="true">
                    <button type="button" className="lk-button" onClick={pagination.prevPage} aria-label="←">←</button>
                    <span className="lk-pagination-count">{`${pagination.currentPage} / ${pagination.totalPageCount}`}</span>
                    <button type="button" className="lk-button" onClick={pagination.nextPage} aria-label="→">→</button>
                </div>
            )}
        </>
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
