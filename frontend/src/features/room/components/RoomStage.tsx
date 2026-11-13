import * as React from 'react'
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core'
import { isEqualTrackRef, isTrackReference } from '@livekit/components-core'
import { RoomEvent, Track } from 'livekit-client'
import {
    ConnectionStateToast,
    ControlBar,
    FocusLayout,
    FocusLayoutContainer,
    LayoutContextProvider,
    ParticipantTile,
    RoomAudioRenderer,
    useCreateLayoutContext,
    useLocalParticipant,
    useLocalParticipantPermissions,
    useMaybeTrackRefContext,
    useParticipants,
    usePinnedTracks,
    useTracks,
} from '@livekit/components-react'
import { useI18n } from '@/shared/i18n/I18nContext'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'
import { LanguageToggle } from '@/shared/ui/LanguageToggle'
import { ChatIcon, MicLockedIcon, UsersIcon } from '@/shared/ui/icons'
import { OrderedCarousel, OrderedGrid } from './OrderedLayouts'
import { HandRaiseButton } from './HandRaiseButton'
import { ReactionsControl } from './ReactionsControl'
import { PollControl } from './PollControl'
import { ScreenShareRequestButton } from './ScreenShareRequestButton'
import { LeaveButton } from './LeaveButton'
import { RoomSettingsMenu } from './RoomSettingsMenu'
import { listParticipantPhotos } from '../api/roomApi'
import { sortByRaisedHand, useHandRaisedAt } from '../hooks/useHandRaisedAt'
import type { HostRequests } from '../hooks/useHostRequests'

// Той самий обхід типів React 18 vs React 19, що й для LiveKitRoom у MeetingRoomPage —
// ParticipantTile типізований через forwardRef, який повертає `React.ReactNode`
// (включно з undefined), а наш React 18.2 вимагає від JSX-компонента `Element | null`.
// Що потрібно кожній плитці, щоб показати чужі дані: фото профілю (для заглушки вимкненої
// камери) і момент підняття руки. GridLayout/CarouselLayout самі клонують дочірню плитку
// для кожного треку, тож передати їй пропси напряму не можна — звідси контекст.
interface StageContextValue {
    photos: Record<string, string>      // identity (== userId) → URL фото
    banners: Record<string, string>     // identity → URL банера профілю (фон плитки без камери)
    handRaisedAt: Record<string, number> // identity → момент підняття руки
}
const StageContext = React.createContext<StageContextValue>({ photos: {}, banners: {}, handRaisedAt: {} })

// Той самий обхід типів React 18 vs React 19, що й для LiveKitRoom у MeetingRoomPage:
// тут потрібен варіант, що приймає звичайні пропси (className/style/data-*).
const TypedParticipantTileBase = ParticipantTile as unknown as (props: {
    className?: string
    style?: React.CSSProperties
    'data-hand-raised'?: string
}) => JSX.Element

// Кожна плитка сама дізнається свій identity з TrackRefContext (який створює GridLayout/
// CarouselLayout) і підставляє свої дані інлайн: фото — через --participant-avatar-url,
// піднята рука — через data-hand-raised (рожева іконка й рамка малюються в CSS).
function ParticipantTileWithExtras() {
    const trackRef = useMaybeTrackRefContext()
    const { photos, banners, handRaisedAt } = React.useContext(StageContext)
    const identity = trackRef?.participant.identity
    const photoUrl = identity && !trackRef?.participant.isLocal ? photos[identity] : undefined
    const bannerUrl = identity && !trackRef?.participant.isLocal ? banners[identity] : undefined
    const raised = identity !== undefined && handRaisedAt[identity] !== undefined
    return (
        <TypedParticipantTileBase
            className={[photoUrl ? 'has-remote-avatar' : '', bannerUrl ? 'has-remote-banner' : ''].filter(Boolean).join(' ') || undefined}
            style={photoUrl || bannerUrl ? ({
                ...(photoUrl ? { '--participant-avatar-url': `url(${photoUrl})` } : {}),
                ...(bannerUrl ? { '--participant-banner-url': `url(${bannerUrl})` } : {}),
            } as React.CSSProperties) : undefined}
            data-hand-raised={raised ? 'true' : undefined}
        />
    )
}
const TypedParticipantTileWithExtras = ParticipantTileWithExtras as unknown as () => JSX.Element

interface RoomStageProps {
    isHost: boolean
    meetingId?: string
    title: string
    publicId: string
    waitingRoomEnabled: boolean
    requests: HostRequests
    panelOpen: boolean
    chatOpen: boolean
    onTogglePanel: () => void
    onToggleChat: () => void
}

// Власна заміна прегенерованого <VideoConference/>: сітка/фокус-розкладка лишаються такими
// ж (скопійовано з прототипу бібліотеки), але керування розкладене так:
//  • знизу, в одному рядку: мікрофон, камера, показ екрана, чат, вихід (саме в такому порядку);
//  • зверху ліворуч: назва конференції, «Учасники» (з лічильником запитів для організатора),
//    «Підняти руку»; зверху праворуч: мова й тема.
// Вбудований чат LiveKit (Chat/ChatToggle) не рендеримо — controls={{chat: false}} — бо є
// власна ChatPanel, що відкривається збоку.
export function RoomStage({ isHost, meetingId, title, publicId, waitingRoomEnabled, requests, panelOpen, chatOpen, onTogglePanel, onToggleChat }: RoomStageProps) {
    const { t } = useI18n()
    const lastAutoFocusedScreenShareTrack = React.useRef<TrackReferenceOrPlaceholder | null>(null)
    const [photos, setPhotos] = React.useState<Record<string, string>>({})
    const [banners, setBanners] = React.useState<Record<string, string>>({})
    const handRaisedAt = useHandRaisedAt()
    const participants = useParticipants()
    const permissions = useLocalParticipantPermissions()
    const { localParticipant, isMicrophoneEnabled } = useLocalParticipant()

    // Фото інших учасників можуть з'явитись (хтось завантажив своє) або змінитись
    // (хтось зайшов/вийшов) протягом зустрічі — тому опитуємо, а не читаємо один раз.
    React.useEffect(() => {
        if (!meetingId) return
        let cancelled = false
        const load = () => {
            listParticipantPhotos(meetingId)
                .then((list) => {
                    if (cancelled) return
                    const map: Record<string, string> = {}
                    const bannerMap: Record<string, string> = {}
                    for (const p of list) {
                        if (p.photoUrl) map[p.userId] = p.photoUrl
                        if (p.bannerUrl) bannerMap[p.userId] = p.bannerUrl
                    }
                    setPhotos(map)
                    setBanners(bannerMap)
                })
                .catch(() => {})
        }
        load()
        const interval = window.setInterval(load, 8000)
        return () => {
            cancelled = true
            window.clearInterval(interval)
        }
    }, [meetingId])

    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false },
    )

    // Підняті руки — першими й у порядку підняття (лівий верхній кут сітки — найперший).
    const sortedTracks = React.useMemo(
        () => sortByRaisedHand(tracks, (tr) => tr.participant.identity, handRaisedAt),
        [tracks, handRaisedAt],
    )

    const layoutContext = useCreateLayoutContext()

    const screenShareTracks = tracks
        .filter(isTrackReference)
        .filter((track) => track.publication.source === Track.Source.ScreenShare)

    const focusTrack = usePinnedTracks(layoutContext)?.[0]
    // Закріплена (збільшена) плитка рендериться самим LiveKit, а не нашою обгорткою,
    // тож фото й руку для неї підставляємо звідси.
    const focusIdentity = focusTrack?.participant.identity
    const focusPhotoUrl = focusIdentity && !focusTrack?.participant.isLocal ? photos[focusIdentity] : undefined
    const focusBannerUrl = focusIdentity && !focusTrack?.participant.isLocal ? banners[focusIdentity] : undefined
    const focusRaised = focusIdentity !== undefined && handRaisedAt[focusIdentity] !== undefined
    const carouselTracks = sortedTracks.filter((track) => !isEqualTrackRef(track, focusTrack))

    React.useEffect(() => {
        if (
            screenShareTracks.some((track) => track.publication.isSubscribed) &&
            lastAutoFocusedScreenShareTrack.current === null
        ) {
            layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: screenShareTracks[0] })
            lastAutoFocusedScreenShareTrack.current = screenShareTracks[0]
        } else if (
            lastAutoFocusedScreenShareTrack.current &&
            !screenShareTracks.some(
                (track) => track.publication.trackSid === lastAutoFocusedScreenShareTrack.current?.publication?.trackSid,
            )
        ) {
            layoutContext.pin.dispatch?.({ msg: 'clear_pin' })
            lastAutoFocusedScreenShareTrack.current = null
        }
        if (focusTrack && !isTrackReference(focusTrack)) {
            const updatedFocusTrack = tracks.find(
                (tr) => tr.participant.identity === focusTrack.participant.identity && tr.source === focusTrack.source,
            )
            if (updatedFocusTrack !== focusTrack && isTrackReference(updatedFocusTrack)) {
                layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: updatedFocusTrack })
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        screenShareTracks.map((ref) => `${ref.publication.trackSid}_${ref.publication.isSubscribed}`).join(),
        focusTrack?.publication?.trackSid,
        tracks,
    ])

    // Порожній список джерел у LiveKit означає "дозволено все" (так у організатора).
    // TrackSource у протоколі: 2 = MICROPHONE, 3 = SCREEN_SHARE.
    const canPublishSource = (source: number) =>
        Boolean(permissions?.canPublish) &&
        (permissions!.canPublishSources.length === 0 || permissions!.canPublishSources.includes(source))
    const micAllowed = permissions ? canPublishSource(2) : true
    const screenAllowed = permissions ? canPublishSource(3) : false

    // Страховка на боці клієнта до серверної (RoomService.enforceMutedMeetings): поки організатор
    // заглушив усіх, мікрофон у учасника миттєво вимикається знову, навіть якщо його якось увімкнули.
    React.useEffect(() => {
        if (!isHost && !micAllowed && isMicrophoneEnabled) {
            localParticipant.setMicrophoneEnabled(false).catch(() => {})
        }
    }, [isHost, micAllowed, isMicrophoneEnabled, localParticipant])

    return (
        <div className="lk-video-conference">
            <StageContext.Provider value={{ photos, banners, handRaisedAt }}>
                <LayoutContextProvider value={layoutContext}>
                    <div className="room-topbar">
                        <div className="room-topbar-left">
                            <h1 className="room-title" title={title}>{title}</h1>
                            <button
                                type="button"
                                className={`participants-toggle room-topbar-button ${panelOpen ? 'is-active' : ''}`}
                                aria-pressed={panelOpen}
                                onClick={onTogglePanel}
                            >
                                <UsersIcon /> {t('room.participantsToggle')} ({participants.length})
                                {isHost && requests.count > 0 && (
                                    <span className="request-badge" aria-label={t('room.requestsBadge', { count: requests.count })}>
                                        {requests.count}
                                    </span>
                                )}
                            </button>
                            <HandRaiseButton />
                            <ReactionsControl isHost={isHost} />
                            <PollControl isHost={isHost} />
                        </div>
                        <div className="room-topbar-right">
                            <LanguageToggle />
                            <ThemeToggle />
                            <RoomSettingsMenu
                                isHost={isHost}
                                meetingId={meetingId}
                                publicId={publicId}
                                waitingRoomEnabled={waitingRoomEnabled}
                            />
                        </div>
                    </div>

                    <div className="lk-video-conference-inner">
                        {!focusTrack ? (
                            <div className="lk-grid-layout-wrapper">
                                <OrderedGrid tracks={sortedTracks}>
                                    <TypedParticipantTileWithExtras />
                                </OrderedGrid>
                            </div>
                        ) : (
                            <div className="lk-focus-layout-wrapper">
                                <FocusLayoutContainer className={carouselTracks.length === 0 ? 'no-carousel' : undefined}>
                                    {carouselTracks.length > 0 && (
                                        <OrderedCarousel tracks={carouselTracks}>
                                            <TypedParticipantTileWithExtras />
                                        </OrderedCarousel>
                                    )}
                                    {focusTrack && (
                                        <FocusLayout
                                            trackRef={focusTrack}
                                            className={[focusPhotoUrl ? 'has-remote-avatar' : '', focusBannerUrl ? 'has-remote-banner' : ''].filter(Boolean).join(' ') || undefined}
                                            style={focusPhotoUrl || focusBannerUrl ? ({
                                                ...(focusPhotoUrl ? { '--participant-avatar-url': `url(${focusPhotoUrl})` } : {}),
                                                ...(focusBannerUrl ? { '--participant-banner-url': `url(${focusBannerUrl})` } : {}),
                                            } as React.CSSProperties) : undefined}
                                            data-hand-raised={focusRaised ? 'true' : undefined}
                                        />
                                    )}
                                </FocusLayoutContainer>
                            </div>
                        )}
                        <div className="room-bottom-bar">
                            {!micAllowed && (
                                <button type="button" className="lk-button room-mic-locked" disabled title={t('room.micLocked')}>
                                    <MicLockedIcon /> {t('device.microphone')}
                                </button>
                            )}
                            <ControlBar controls={{ chat: false, leave: false }} />
                            {!isHost && meetingId && !screenAllowed && <ScreenShareRequestButton meetingId={meetingId} />}
                            <button
                                type="button"
                                className={`lk-button ${chatOpen ? 'room-bar-active' : ''}`}
                                aria-pressed={chatOpen}
                                onClick={onToggleChat}
                            >
                                <ChatIcon /> {t('room.chatToggle')}
                            </button>
                            <LeaveButton isHost={isHost} meetingId={meetingId} />
                        </div>
                    </div>
                </LayoutContextProvider>
            </StageContext.Provider>
            <RoomAudioRenderer />
            <ConnectionStateToast />
        </div>
    )
}
