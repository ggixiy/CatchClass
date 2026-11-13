import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getMyProfile, UserProfile } from '@/features/user'
import { tokenStore } from '@/shared/api/tokenStore'
import { useI18n } from '@/shared/i18n/I18nContext'
import { LanguageToggle } from '@/shared/ui/LanguageToggle'
import { Avatar } from '@/shared/ui/Avatar'
import { Logo } from '@/shared/ui/Logo'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'

// Спільна обгортка сторінок: шапка з логотипом і навігацією + футер.
// Кімната конференції займає весь екран і має власну панель керування — там обгортки немає.
export function AppLayout() {
    const { t } = useI18n()
    const { pathname } = useLocation()
    const navigate = useNavigate()
    const loggedIn = tokenStore.getAccessToken() !== null

    const [profile, setProfile] = useState<UserProfile | null>(null)

    // Профіль для кнопки в шапці; оновлюємо при зміні сторінки (наприклад, після нового фото).
    useEffect(() => {
        if (!loggedIn || pathname.startsWith('/room/')) return
        getMyProfile().then(setProfile).catch(() => setProfile(null))
    }, [loggedIn, pathname])

    // Висота липкої шапки як CSS-змінна: липкі елементи на сторінках (вкладки курсу) стають під нею, а не під шапкою.
    useEffect(() => {
        const header = document.querySelector<HTMLElement>('.site-header')
        if (!header) return
        const update = () => document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`)
        update()
        const observer = new ResizeObserver(update)
        observer.observe(header)
        return () => observer.disconnect()
    }, [pathname])

    if (pathname.startsWith('/room/')) return <Outlet />

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
                            <NavLink to="/courses">{t('layout.courses')}</NavLink>
                        </nav>
                    )}

                    <div className="site-header-actions">
                        <LanguageToggle />
                        <ThemeToggle />
                        {loggedIn
                            ? (
                                <Link to="/profile" className="profile-chip" title={t('layout.account')}>
                                    <Avatar size={32} photoUrl={profile?.photoUrl ?? null} displayName={profile?.displayName || '?'} />
                                    <span className="profile-chip-name">{profile?.displayName ?? t('layout.account')}</span>
                                </Link>
                            )
                            : <button type="button" className="btn-primary" onClick={() => navigate('/login')}>{t('layout.login')}</button>}
                    </div>
                </div>
            </header>

            <div className="app-content"><Outlet /></div>

            <footer className="site-footer">
                <div className="site-footer-compact">
                    <Link to="/" className="site-brand"><Logo size={26} /><span className="site-brand-name">CatchClass</span></Link>
                    <p>{t('layout.tagline')}</p>
                </div>
                <div className="site-footer-bottom">
                    <span>© {new Date().getFullYear()} CatchClass</span>
                </div>
            </footer>
        </div>
    )
}
