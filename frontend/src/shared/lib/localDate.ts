// Дата (РРРР-ММ-ДД) у ЛОКАЛЬНОМУ часовому поясі користувача.
// Не можна брати d.toISOString().slice(0, 10): це дата за UTC, і заняття, заплановане
// о 01:00 за Києвом, потрапляло б на попередній день.
export function toLocalDateKey(value: Date | string): string {
    const d = typeof value === 'string' ? new Date(value) : value
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
