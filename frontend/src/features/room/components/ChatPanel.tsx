import { FormEvent, useEffect, useRef, useState } from 'react'
import { useChat, useLocalParticipant } from '@livekit/components-react'
import { useI18n } from '@/shared/i18n/I18nContext'

interface ChatPanelProps {
    open: boolean
    onClose: () => void
}

// Чат заняття — повідомлення не зберігаються на сервері, лише живуть у LiveKit data-каналі
// поки триває конференція (так само, як у Zoom/Meet для звичайного текстового чату).
export function ChatPanel({ open, onClose }: ChatPanelProps) {
    const { t } = useI18n()
    const { chatMessages, send, isSending } = useChat()
    const { localParticipant } = useLocalParticipant()
    const [draft, setDraft] = useState('')
    const listRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight
        }
    }, [chatMessages, open])

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        const text = draft.trim()
        if (!text) return
        setDraft('')
        try {
            await send(text)
        } catch {
            // Повідомлення просто не дійде — додаткового UI для цього поки не робимо.
        }
    }

    if (!open) return null

    return (
        <aside className="chat-panel">
            <div className="chat-panel-header">
                <h3>{t('room.chatTitle')}</h3>
                <button type="button" className="icon-button" onClick={onClose} title={t('common.close')}>×</button>
            </div>

            <div className="chat-panel-messages" ref={listRef}>
                {chatMessages.length === 0 && <p className="hint">{t('room.chatEmpty')}</p>}
                {chatMessages.map((msg) => {
                    const isOwn = msg.from?.identity === localParticipant.identity
                    return (
                        <div key={msg.id} className={`chat-message ${isOwn ? 'chat-message-own' : ''}`}>
                            <div className="chat-message-meta">
                                <span className="chat-message-author">{isOwn ? t('room.chatYou') : msg.from?.name || t('room.chatParticipant')}</span>
                                <span className="chat-message-time">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="chat-message-text">{msg.message}</div>
                        </div>
                    )
                })}
            </div>

            <form className="chat-panel-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={t('room.chatPlaceholder')}
                    maxLength={1000}
                />
                <button type="submit" className="btn-primary" disabled={isSending || !draft.trim()}>{t('room.chatSend')}</button>
            </form>
        </aside>
    )
}
