import { useCallback, useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { tryRestoreSession } from '@/features/auth'
import { I18nProvider, useI18n } from '@/shared/i18n/I18nContext'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'
import { router } from './router'

function AppShell() {
  const [ready, setReady] = useState(false)
  // Екран завантаження з'являється лише якщо відновлення сесії триває довше за мить — щоб не блимати
  const [splash, setSplash] = useState(false)
  const [finished, setFinished] = useState(false)
  const { t } = useI18n()
  const onDone = useCallback(() => setFinished(true), [])

  useEffect(() => {
    tryRestoreSession().finally(() => setReady(true))
    const id = window.setTimeout(() => setSplash(true), 250)
    return () => window.clearTimeout(id)
  }, [])

  if (!ready && !splash) return null
  if (splash && !finished) return <LoadingScreen done={ready} onDone={onDone} label={t('app.loading')} />
  if (!ready) return null

  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export function App() {
  return (
    <I18nProvider>
      <AppShell />
    </I18nProvider>
  )
}
