import { useI18n } from '@/shared/i18n/I18nContext'

interface MonthCalendarProps {
    year: number
    month: number // 0–11
    occurrencesByDay: Map<string, number>
    selectedDay: string | null
    onSelectDay: (day: string) => void
    onPrevMonth: () => void
    onNextMonth: () => void
}

function toDateKey(d: Date) {
    return d.toISOString().slice(0, 10)
}

export function MonthCalendar({
                                  year, month, occurrencesByDay, selectedDay, onSelectDay, onPrevMonth, onNextMonth,
                              }: MonthCalendarProps) {
    const { tList } = useI18n()
    const weekdays = tList('calendar.weekdays')
    const monthNames = tList('calendar.months')

    const firstOfMonth = new Date(Date.UTC(year, month, 1))
    const startWeekday = (firstOfMonth.getUTCDay() + 6) % 7 // понеділок = 0
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

    const cells: (Date | null)[] = []
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(Date.UTC(year, month, d)))

    const todayKey = toDateKey(new Date())

    return (
        <div className="calendar">
            <div className="calendar-header">
                <button type="button" className="icon-button calendar-nav" onClick={onPrevMonth}>←</button>
                <strong>{monthNames[month]} {year}</strong>
                <button type="button" className="icon-button calendar-nav" onClick={onNextMonth}>→</button>
            </div>
            <div className="calendar-grid calendar-weekdays">
                {weekdays.map((w) => <div key={w} className="calendar-weekday">{w}</div>)}
            </div>
            <div className="calendar-grid">
                {cells.map((date, i) => {
                    if (!date) return <div key={i} className="calendar-cell calendar-cell-empty" />
                    const key = toDateKey(date)
                    const count = occurrencesByDay.get(key) ?? 0
                    return (
                        <button
                            type="button"
                            key={i}
                            className={[
                                'calendar-cell',
                                key === todayKey && 'calendar-cell-today',
                                key === selectedDay && 'calendar-cell-selected',
                            ].filter(Boolean).join(' ')}
                            onClick={() => onSelectDay(key)}
                        >
                            <span>{date.getUTCDate()}</span>
                            {count > 0 && <span className="calendar-dot" />}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
