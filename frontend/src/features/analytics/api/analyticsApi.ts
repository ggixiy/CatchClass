import { http } from '@/shared/api/http'

export interface DashboardLesson {
    meetingId: string
    publicId: string
    title: string
    courseId: string | null
    courseTitle: string | null
    start: string
    end: string
    status: 'UPCOMING' | 'LIVE' | 'DONE'
    attended: number | null
    members: number | null
    percent: number | null
}

export interface TopStudent {
    userId: string
    displayName: string
    photoUrl: string | null
    lessonsAttended: number
    minutes: number
}

export interface CourseStat {
    courseId: string
    title: string
    members: number
    lessonsHeld: number
    averageAttendance: number | null
}

export interface TeacherDashboard {
    weekStart: string
    weekEnd: string
    weekLessons: DashboardLesson[]
    averageAttendance: number | null
    lessonsHeld: number
    studentsTotal: number
    topStudents: TopStudent[]
    courses: CourseStat[]
}

export interface JournalLesson { meetingId: string; title: string; start: string }
export interface JournalStudent { userId: string; displayName: string; email: string; minutes: number[]; attended: number }
export interface AttendanceJournal { lessons: JournalLesson[]; students: JournalStudent[] }

export function getTeacherDashboard(courseId: string) {
    return http<TeacherDashboard>(`/analytics/teacher?courseId=${courseId}`)
}

export function getAttendanceJournal(courseId: string) {
    return http<AttendanceJournal>(`/analytics/courses/${courseId}/attendance`)
}
