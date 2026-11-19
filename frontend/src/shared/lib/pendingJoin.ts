// Відкладений вхід у зустріч: людина відкрила посилання, не будучи авторизованою.
// Дані зустрічі зберігаємо в sessionStorage (не в URL, щоб пароль не лишався в історії браузера)
// і після входу/реєстрації повертаємо її до приєднання без повторного введення.
const KEY = 'catchclass.pendingJoin'
const TTL_MS = 30 * 60 * 1000

export interface PendingJoin {
    publicId: string
    password: string
}

export function savePendingJoin(value: PendingJoin) {
    try {
        sessionStorage.setItem(KEY, JSON.stringify({ ...value, savedAt: Date.now() }))
    } catch {
        // сховище недоступне — просто втратимо автоповернення
    }
}

export function readPendingJoin(): PendingJoin | null {
    try {
        const raw = sessionStorage.getItem(KEY)
        if (!raw) return null
        const data = JSON.parse(raw)
        if (!data.publicId || Date.now() - data.savedAt > TTL_MS) {
            sessionStorage.removeItem(KEY)
            return null
        }
        return { publicId: data.publicId, password: data.password ?? '' }
    } catch {
        return null
    }
}

export function clearPendingJoin() {
    try {
        sessionStorage.removeItem(KEY)
    } catch {
        // ігноруємо
    }
}
