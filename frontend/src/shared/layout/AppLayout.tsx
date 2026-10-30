import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '@/features/auth'
import { tokenStore } from '@/shared/api/tokenStore'
import { useI18n } from '@/shared/i18n/I18nContext'
import { LanguageToggle } from '@/shared/ui/LanguageToggle'
import { Logo } from '@/shared/ui/Logo'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'

// Спільна обгортка сторінок: шапка з логотипом і навігацією + футер.
// Кімната конференції займає весь екран і має власну панель керування — там обгортки немає.
export function AppLayout() {
    const { t } = useI18n()
    const { pathname } = useLocation()
    const navigate = useNavigate()
    const loggedIn = tokenStore.getAccessToken() !== null

    if (pathname.startsWith('/room/')) return <Outlet />

    async function handleLogout() {
        await logout()
        navigate('/login')
    }

    return (
        <div className="app-shell">
            <header className="site-header">
                <div className="site-header-inner">
                    <Link to="/" className="site-brand" aria-label="CatchClass">
                        <Logo />
                        <span className="site-brand-name">CatchClass</span>
                    </Link>

                    {loggedIn && (
                        <nav className="site-nav" aria-label={t('layout.navLabel')}>
                            <NavLink to="/" end>{t('layout.home')}</NavLink>
                            <NavLink to="/profile">{t('layout.account')}</NavLink>
                        </nav>
                    )}

                    <div className="site-header-actions">
                        <LanguageToggle />
                        <ThemeToggle />
                        {loggedIn
                            ? <button type="button" className="btn-accent" onClick={handleLogout}>{t('layout.logout')}</button>
                            : <button type="button" className="btn-primary" onClick={() => navigate('/login')}>{t('layout.login')}</button>}
                    </div>
                </div>
            </header>

            <div className="app-content"><Outlet /></div>

            <footer className="site-footer">
                <div className="site-footer-inner">
                    <div className="site-footer-about">
                        <Link to="/" className="site-brand"><Logo size={30} /><span className="site-brand-name">CatchClass</span></Link>
                        <p>{t('layout.tagline')}</p>
                    </div>
                    <div className="site-footer-col">
                        <h2>{t('layout.footerService')}</h2>
                        <ul>
                            <li><Link to="/">{t('layout.home')}</Link></li>
                            <li><Link to="/">{t('layout.footerJoin')}</Link></li>
                        </ul>
                    </div>
                    <div className="site-footer-col">
                        <h2>{t('layout.footerAccount')}</h2>
                        <ul>
                            {loggedIn
                                ? <li><Link to="/profile">{t('layout.account')}</Link></li>
                                : <>
                                    <li><Link to="/login">{t('layout.login')}</Link></li>
                                    <li><Link to="/signup">{t('layout.signup')}</Link></li>
                                </>}
                        </ul>
                    </div>
                </div>
                <div className="site-footer-bottom">
                    <span>© {new Date().getFullYear()} CatchClass</span>
                    <span>{t('layout.course')}</span>
                </div>
            </footer>
        </div>
    )
}
