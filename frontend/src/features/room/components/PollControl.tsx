import { FormEvent, useEffect, useRef, useState } from 'react'
import { RoomEvent } from 'livekit-client'
import { useParticipants, useRoomContext } from '@livekit/components-react'
import { useI18n } from '@/shared/i18n/I18nContext'
import { PollIcon } from '@/shared/ui/icons'
import { useDataTopic } from '../hooks/useDataTopic'

interface Poll {
    id: string
    question: string
    options: string[]
    quiz: boolean
}

interface PollState {
    poll: Poll
    votes: Record<string, number> // identity → індекс варіанта
    closed: boolean
    correct: number | null // відкривається лише після завершення
}

type PollMsg =
    | { type: 'start'; poll: Poll }
    | { type: 'vote'; pollId: string; option: number }
    | { type: 'close'; pollId: string; correct: number | null }
    | { type: 'snapshot'; state: PollState }
    | { type: 'dismiss'; pollId: string }

const MIN_OPTIONS = 2
const MAX_OPTIONS = 6

// Опитування й міні-тести. Стан живе лише на клієнтах (LiveKit data-повідомлення):
// організатор запускає питання, усі голосують, розподіл видно наживо. Правильна відповідь
// квізу ховається у організатора до завершення і розсилається лише в повідомленні «close».
export function PollControl({ isHost }: { isHost: boolean }) {
    const { t } = useI18n()
    const room = useRoomContext()
    const participants = useParticipants()
    const [state, setState] = useState<PollState | null>(null)
    const [creating, setCreating] = useState(false)
    const [minimized, setMinimized] = useState(false)
    const stateRef = useRef<PollState | null>(null)
    stateRef.current = state
    const correctSecret = useRef<number | null>(null) // тільки в організатора
    const names = Object.fromEntries(participants.map((p) => [p.identity, p.name || p.identity]))

    const send = useDataTopic<PollMsg>('cc-poll', (msg, from) => {
        if (msg.type === 'start') {
            if (!isHost || from === room.localParticipant.identity) {
                setState({ poll: msg.poll, votes: {}, closed: false, correct: null })
                setMinimized(false)
            }
        } else if (msg.type === 'vote') {
            setState((s) => {
                if (!s || s.poll.id !== msg.pollId || s.closed) return s
                if (msg.option < 0 || msg.option >= s.poll.options.length) return s
                return { ...s, votes: { ...s.votes, [from]: msg.option } }
            })
        } else if (msg.type === 'close') {
            setState((s) => (s && s.poll.id === msg.pollId ? { ...s, closed: true, correct: msg.correct } : s))
        } else if (msg.type === 'snapshot') {
            if (!stateRef.current) { setState(msg.state); setMinimized(false) }
        } else if (msg.type === 'dismiss') {
            setState((s) => (s && s.poll.id === msg.pollId ? null : s))
        }
    })

    // Новоприєднаному учаснику організатор повторно надсилає поточний стан опитування.
    useEffect(() => {
        if (!isHost) return
        function onJoin(p: { identity: string }) {
            const s = stateRef.current
            if (!s) return
            window.setTimeout(() => send({ type: 'snapshot', state: s }, [p.identity]), 800)
        }
        room.on(RoomEvent.ParticipantConnected, onJoin)
        return () => { room.off(RoomEvent.ParticipantConnected, onJoin) }
    }, [room, isHost, send])

    function start(poll: Poll, correct: number | null) {
        correctSecret.current = correct
        send({ type: 'start', poll })
        setState({ poll, votes: {}, closed: false, correct: null })
        setCreating(false)
        setMinimized(false)
    }

    const myIdentity = room.localParticipant.identity
    const myVote = state ? state.votes[myIdentity] : undefined
    const total = state ? Object.keys(state.votes).length : 0
    const counts = state ? state.poll.options.map((_, i) => Object.values(state.votes).filter((v) => v === i).length) : []

    return (
        <>
            {isHost && (
                <button
                    type="button"
                    className="participants-toggle room-topbar-button"
                    onClick={() => (state && !state.closed ? setMinimized(false) : setCreating(true))}
                >
                    <PollIcon /> {t('room.poll')}
                </button>
            )}

            {creating && <PollCreateDialog onCancel={() => setCreating(false)} onStart={start} />}

            {state && !minimized && (
                <aside className="poll-panel" role="dialog" aria-label={t('room.poll')}>
                    <div className="poll-panel-head">
                        <strong>{state.poll.question}</strong>
                        <button type="button" className="poll-min" onClick={() => setMinimized(true)} aria-label={t('room.pollHide')}>–</button>
                    </div>
                    <ul className="poll-options">
                        {state.poll.options.map((opt, i) => {
                            const pct = total > 0 ? Math.round((counts[i] * 100) / total) : 0
                            const voters = isHost ? Object.entries(state.votes).filter(([, v]) => v === i).map(([id]) => names[id] ?? id) : []
                            const isCorrect = state.closed && state.correct === i
                            const showResults = state.closed || myVote !== undefined || isHost
                            return (
                                <li key={i}>
                                    <button
                                        type="button"
                                        className={`poll-option ${myVote === i ? 'is-mine' : ''} ${isCorrect ? 'is-correct' : ''}`}
                                        disabled={state.closed}
                                        onClick={() => send({ type: 'vote', pollId: state.poll.id, option: i })}
                                    >
                                        {showResults && <span className="poll-fill" style={{ width: `${pct}%` }} />}
                                        <span className="poll-option-text">{opt}</span>
                                        {showResults && <span className="poll-option-count">{counts[i]} · {pct}%</span>}
                                    </button>
                                    {voters.length > 0 && <small className="poll-voters">{voters.join(', ')}</small>}
                                </li>
                            )
                        })}
                    </ul>
                    <div className="poll-foot">
                        <small>{t('room.pollVotes', { count: total })}{state.closed && ` · ${t('room.pollClosed')}`}</small>
                        {state.closed && state.poll.quiz && state.correct !== null && myVote !== undefined && (
                            <small className={myVote === state.correct ? 'poll-right' : 'poll-wrong'}>
                                {myVote === state.correct ? t('room.pollRight') : t('room.pollWrong')}
                            </small>
                        )}
                        {isHost && (
                            <div className="poll-host-actions">
                                {!state.closed ? (
                                    <button type="button" onClick={() => {
                                        const correct = state.poll.quiz ? correctSecret.current : null
                                        send({ type: 'close', pollId: state.poll.id, correct })
                                    }}>{t('room.pollClose')}</button>
                                ) : (
                                    <>
                                        <button type="button" onClick={() => { send({ type: 'dismiss', pollId: state.poll.id }); setState(null) }}>{t('room.pollDismiss')}</button>
                                        <button type="button" onClick={() => setCreating(true)}>{t('room.pollNew')}</button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </aside>
            )}

            {state && minimized && (
                <button type="button" className="poll-chip" onClick={() => setMinimized(false)}>
                    <PollIcon /> {t('room.pollShow')}
                </button>
            )}
        </>
    )
}

function PollCreateDialog({ onCancel, onStart }: { onCancel: () => void; onStart: (poll: Poll, correct: number | null) => void }) {
    const { t } = useI18n()
    const [question, setQuestion] = useState('')
    const [options, setOptions] = useState(['', ''])
    const [quiz, setQuiz] = useState(false)
    const [correct, setCorrect] = useState(0)

    const filled = options.map((o) => o.trim())
    const valid = question.trim().length > 0 && filled.filter(Boolean).length >= MIN_OPTIONS && (!quiz || filled[correct])

    function submit(e: FormEvent) {
        e.preventDefault()
        if (!valid) return
        // порожні варіанти відкидаємо, тож індекс правильної перераховуємо
        const kept = filled.map((text, i) => ({ text, i })).filter((o) => o.text)
        const newCorrect = quiz ? kept.findIndex((o) => o.i === correct) : null
        onStart({ id: crypto.randomUUID(), question: question.trim(), options: kept.map((o) => o.text), quiz }, newCorrect)
    }

    return (
        <div className="poll-backdrop">
            <form className="poll-dialog" onSubmit={submit}>
                <h2>{t('room.pollNewTitle')}</h2>
                <label className="stacked-label">
                    {t('room.pollQuestion')}
                    <input value={question} maxLength={200} autoFocus onChange={(e) => setQuestion(e.target.value)} />
                </label>
                <div className="poll-create-options">
                    {options.map((o, i) => (
                        <div className="poll-create-row" key={i}>
                            {quiz && (
                                <input type="radio" name="correct" checked={correct === i} onChange={() => setCorrect(i)} aria-label={t('room.pollCorrect')} />
                            )}
                            <input
                                value={o}
                                maxLength={100}
                                placeholder={t('room.pollOption', { n: i + 1 })}
                                onChange={(e) => setOptions((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                            />
                            {options.length > MIN_OPTIONS && (
                                <button type="button" onClick={() => {
                                    setOptions((prev) => prev.filter((_, j) => j !== i))
                                    setCorrect((c) => (c >= i && c > 0 ? c - 1 : c))
                                }} aria-label={t('common.delete')}>×</button>
                            )}
                        </div>
                    ))}
                </div>
                {options.length < MAX_OPTIONS && (
                    <button type="button" onClick={() => setOptions((prev) => [...prev, ''])}>{t('room.pollAddOption')}</button>
                )}
                <label className="checkbox-row">
                    <input type="checkbox" checked={quiz} onChange={(e) => setQuiz(e.target.checked)} />
                    <span>{t('room.pollQuizMode')}</span>
                </label>
                {quiz && <p className="hint">{t('room.pollQuizHint')}</p>}
                <div className="form-actions">
                    <button type="button" onClick={onCancel}>{t('common.cancel')}</button>
                    <button type="submit" className="btn-secondary" disabled={!valid}>{t('room.pollStart')}</button>
                </div>
            </form>
        </div>
    )
}
