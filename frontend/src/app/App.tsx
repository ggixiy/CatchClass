import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { tryRestoreSession } from '@/features/auth'
import { router } from './router'

export function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    tryRestoreSession().finally(() => setReady(true))
  }, [])

  if (!ready) {
    return <main className="page"><p>Завантаження…</p></main>
  }

  return <RouterProvider router={router} />
}