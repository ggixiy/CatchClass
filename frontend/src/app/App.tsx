import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { tryRestoreSession } from '@/features/auth'
import { I18nProvider, useI18n } from '@/shared/i18n/I18nContext'
import { router } from './router'

function AppShell() {
  const [ready, setReady] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    tryRestoreSession().finally(() => setReady(true))
  }, [])

  if (!ready) {
    return <main className="page"><p>{t('app.loading')}</p></main>
  }

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