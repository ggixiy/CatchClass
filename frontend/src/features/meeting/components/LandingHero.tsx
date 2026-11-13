import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/shared/i18n/I18nContext'

// Риски всередині кіл: окремий SVG-елемент, лінії із заокругленими кінцями. Довжина кожної різна
// (детермінований «хаотичний» візерунок із двох синусоїд), тож смуга кола заповнена нерівномірно.
function Ticks({ count, from, to, className }: { count: number; from: number; to: number; className: string }) {
    return (
        <g className={className}>
            {Array.from({ length: count }, (_, i) => {
                const k = 0.3 + 0.7 * Math.abs(Math.sin(i * 1.7) * 0.6 + Math.sin(i * 0.43 + 1) * 0.4)
                return (
                    <line key={i} x1={50} y1={50 - from} x2={50} y2={50 - (from + (to - from) * k)} transform={`rotate(${(360 / count) * i} 50 50)`} />
                )
            })}
        </g>
    )
}

// Головна для гостя: один великий градієнт круглої форми з лівого нижнього кута, скляна текстура
// і поверх усього три концентричні кола з рисками в правому нижньому куті.
export function LandingHero() {
    const { t } = useI18n()
    const navigate = useNavigate()

    return (
        <main className="page-wide landing-main">
            <section className="landing-hero">
                <div className="landing-glass" aria-hidden="true" />
                <svg className="landing-grain" aria-hidden="true">
                    <filter id="landing-noise">
                        <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" stitchTiles="stitch" />
                        <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#landing-noise)" />
                </svg>
                <div className="landing-rings" aria-hidden="true">
                    <span className="ring ring-1" />
                    <span className="ring ring-2" />
                    <span className="ring ring-3" />
                    <svg viewBox="0 0 100 100" className="ring-ticks">
                        <Ticks count={120} from={40.5} to={48.5} className="ticks-a" />
                        <Ticks count={96} from={29.5} to={37.5} className="ticks-b" />
                    </svg>
                </div>
                <div className="landing-rings landing-rings-tl" aria-hidden="true">
                    <span className="ring ring-1" />
                    <span className="ring ring-2" />
                    <span className="ring ring-3" />
                    <svg viewBox="0 0 100 100" className="ring-ticks">
                        <Ticks count={120} from={40.5} to={48.5} className="ticks-a" />
                        <Ticks count={96} from={29.5} to={37.5} className="ticks-b" />
                    </svg>
                </div>
                <div className="landing-content">
                    <span className="landing-badge">{t('landing.badge')}</span>
                    <h1 className="landing-title">
                        {t('landing.title1')}<br />
                        {t('landing.title2')} <em>{t('landing.titleAccent')}</em>
                    </h1>
                    <p className="landing-text">{t('landing.text')}</p>
                    <div className="landing-actions">
                        <button type="button" className="landing-btn landing-btn-solid" onClick={() => navigate('/signup')}>{t('landing.signup')}</button>
                        <button type="button" className="landing-btn landing-btn-glass" onClick={() => navigate('/login')}>{t('landing.login')}</button>
                    </div>
                </div>
            </section>
        </main>
    )
}
