import { ReactNode } from 'react'

interface ModalProps {
    title: string
    onClose: () => void
    children: ReactNode
    /** Ширша модалка — для форм із двостовпцевим компонуванням (наприклад, планування заняття). */
    wide?: boolean
}

export function Modal({ title, onClose, children, wide }: ModalProps) {
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className={`modal${wide ? ' modal-wide' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button type="button" className="icon-button modal-close" onClick={onClose}>×</button>
                </div>
                {children}
            </div>
        </div>
    )
}
