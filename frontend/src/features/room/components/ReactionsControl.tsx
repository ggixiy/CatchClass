import { useEffect, useRef, useState } from 'react'
import { useParticipants } from '@livekit/components-react'
import { useI18n } from '@/shared/i18n/I18nContext'
import { SmileIcon } from '@/shared/ui/icons'
import { useDataTopic } from '../hooks/useDataTopic'

const EMOJIS = ['👍', '👏', '❤️', '🎉']
const FLOAT_MS = 4000
const ANSWER_MS = 30_000

type ReactionMsg =
    | { kind: 'emoji'; emoji: string }
    | { kind: 'answer'; value: 'yes' | 'no' }
    | { kind: 'reset' }

interface Floating { id: number; emoji: string; name: string; left: number }
interface Answer { value: 'yes' | 'no'; at: number }

// Реакції (👍 👏 …) та швидкі відповіді «так / ні» під час заняття.
// Реакції літають по екрану 4 с; відповіді враховуються в лічильнику 30 с (останнє слово лишається за людиною).
export function ReactionsControl({ isHost }: { isHost: boolean }) {
    const { t } = useI18n()
    const participants = useParticipants()
    const [open, setOpen] = useState(false)
    const [floating, setFloating] = useState<Floating[]>([])
    const [answers, setAnswers] = useState<Record<string, Answer>>({})
    const [now, setNow] = useState(Date.now())
    const seq = useRef(0)
    const names = useRef<Record<string, string>>({})
    names.current = Object.fromEntries(participants.map((p) => [p.identity, p.name || p.identity]))

    const send = useDataTopic<ReactionMsg>('cc-reaction', (msg, from) => {
        if (msg.kind === 'emoji') {
            const id = ++seq.current
            const item: Floating = { id, emoji: msg.emoji, name: names.current[from] ?? '', left: 8 + Math.random() * 20 }
            setFloating((f) => [...f.slice(-14), item])
            window.setTimeout(() => setFloating((f) => f.filter((x) => x.id !== id)), FLOAT_MS)
        } else if (msg.kind === 'answer') {
            setAnswers((a) => ({ ...a, [from]: { value: msg.value, at: Date.now() } }))
        } else if (msg.kind === 'reset') {
            setAnswers({})
        }
    })

    // Таймер лише поки є відповіді — щоб прострочені зникали самі.
    const hasAnswers = Object.keys(answers).length > 0
    useEffect(() => {
        if (!hasAnswers) return
        const timer = window.setInterval(() => {
            const cutoff = Date.now()
            setNow(cutoff)
            setAnswers((a) => {
                const next = Object.fromEntries(Object.entries(a).filter(([, v]) => cutoff - v.at < ANSWER_MS))
                return Object.keys(next).length === Object.keys(a).length ? a : next
            })
        }, 1000)
        return () => window.clearInterval(timer)
    }, [hasAnswers])

    const live = Object.values(answers).filter((a) => now - a.at < ANSWER_MS + 1000)
    const yes = live.filter((a) => a.value === 'yes').length
    const no = live.length - yes

    return (
        <>
            <div className="reactions-wrap">
                <button
                    type="button"
                    className={`participants-toggle room-topbar-button ${open ? 'is-active' : ''}`}
                    aria-expanded={open}
                    onClick={() => setOpen((o) => !o)}
                >
                    <SmileIcon /> {t('room.reactions')}
                </button>
                {open && (
                    <div className="reactions-menu" role="menu">
                        <div className="reactions-emojis">
                            {EMOJIS.map((e) => (
                                <button key={e} type="button" className="reaction-emoji" onClick={() => send({ kind: 'emoji', emoji: e })}>{e}</button>
                            ))}
                        </div>
                        <div className="reactions-answers">
                            <button type="button" onClick={() => send({ kind: 'answer', value: 'yes' })}>{t('room.answerYes')}</button>
                            <button type="button" onClick={() => send({ kind: 'answer', value: 'no' })}>{t('room.answerNo')}</button>
                        </div>
                    </div>
                )}
            </div>

            {live.length > 0 && (
                <div className="answers-tally" role="status">
                    <span>{t('room.answerYes')}: <strong>{yes}</strong></span>
                    <span>{t('room.answerNo')}: <strong>{no}</strong></span>
                    {isHost && <button type="button" onClick={() => send({ kind: 'reset' })}>{t('room.answersClear')}</button>}
                </div>
            )}

            <div className="reactions-float" aria-hidden="true">
                {floating.map((f) => (
                    <div key={f.id} className="reaction-bubble" style={{ left: `${f.left}%` }}>
                        <span className="reaction-bubble-emoji">{f.emoji}</span>
                        {f.name && <span className="reaction-bubble-name">{f.name}</span>}
                    </div>
                ))}
            </div>
        </>
    )
}
