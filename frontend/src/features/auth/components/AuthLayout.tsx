import type { ReactNode } from 'react'
import { Logo } from '@/shared/ui/Logo'

interface AuthLayoutProps {
    /** Фраза на візуальній панелі ліворуч. */
    visualText: ReactNode
    title: string
    subtitle?: string
    children: ReactNode
}

// Спільна розмітка сторінок входу/реєстрації: ліворуч — суто візуальна панель із розмитими
// рожевими смугами, праворуч — логотип, заголовок і поля прямо на фоні сторінки, без картки.
export function AuthLayout({ visualText, title, subtitle, children }: AuthLayoutProps) {
    return (
        <main className="auth-split">
            <aside className="auth-visual" aria-hidden="true">
                <svg className="auth-grain">
                    <filter id="auth-noise">
                        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
                        <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#auth-noise)" />
                </svg>
                <div className="auth-glass" />
                <p className="auth-visual-text">{visualText}</p>
                <div className="auth-bands">
                    <span style={{ left: '0%', height: '46%' }} />
                    <span style={{ left: '13%', height: '58%' }} />
                    <span style={{ left: '27%', height: '40%' }} />
                    <span style={{ left: '41%', height: '52%' }} />
                    <span style={{ left: '56%', height: '34%' }} />
                    <span style={{ left: '70%', height: '22%' }} />
                </div>
            </aside>
            <section className="auth-form-side">
                <div className="auth-form-inner">
                    <Logo size={46} />
                    <h1>{title}</h1>
                    {subtitle && <p className="auth-subtitle">{subtitle}</p>}
                    <hr className="auth-divider" />
                    {children}
                </div>
            </section>
        </main>
    )
}
