import { http } from '@/shared/api/http'
import { tokenStore } from '@/shared/api/tokenStore'

interface TokenResponse {
    accessToken: string
    tokenType: string
    expiresInSeconds: number
}

export async function register(email: string, displayName: string, password: string) {
    const token = await http<TokenResponse>('/auth/register', {
        method: 'POST',
        body: { email, displayName, password },
        skipAuthRetry: true,
    })
    tokenStore.setAccessToken(token.accessToken)
}

export async function login(email: string, password: string) {
    const token = await http<TokenResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
        skipAuthRetry: true,
    })
    tokenStore.setAccessToken(token.accessToken)
}

export async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } finally {
        tokenStore.setAccessToken(null)
    }
}

// Модульна змінна: якщо цю функцію викликали кілька разів майже одночасно
// (наприклад, React StrictMode у розробці навмисно викликає ефекти двічі),
// усі виклики отримають ОДИН і той самий Promise, а не запустять два запити.
let restoreSessionPromise: Promise<void> | null = null

export function tryRestoreSession(): Promise<void> {
    if (!restoreSessionPromise) {
        restoreSessionPromise = (async () => {
            try {
                const response = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
                if (response.ok) {
                    const data: TokenResponse = await response.json()
                    tokenStore.setAccessToken(data.accessToken)
                }
            } catch {
                // мережева помилка чи немає сесії — лишаємось неавторизованими, це не крах застосунку
            }
        })()
    }
    return restoreSessionPromise
}

export function forgotPassword(email: string) {
    return http<void>('/auth/forgot-password', { method: 'POST', body: { email }, skipAuthRetry: true })
}

export function resetPassword(token: string, newPassword: string) {
    return http<void>('/auth/reset-password', { method: 'POST', body: { token, newPassword }, skipAuthRetry: true })
}

export function verifyEmail(token: string) {
    return http<void>('/auth/verify-email', { method: 'POST', body: { token }, skipAuthRetry: true })
}