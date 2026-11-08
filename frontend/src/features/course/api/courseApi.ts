import { http } from '@/shared/api/http'

export interface Course {
    id: string
    title: string
    description: string | null
    ownerUserId: string
    ownerName: string
    owner: boolean
    // код запрошення бачить лише викладач
    inviteCode: string | null
    memberCount: number
    createdAt: string
}

export interface CourseMember {
    userId: string
    displayName: string
    email: string
    photoUrl: string | null
    joinedAt: string
    owner: boolean
}

export interface CourseFormData {
    title: string
    description: string
}

export function listCourses() {
    return http<Course[]>('/courses')
}

export function getCourse(id: string) {
    return http<Course>(`/courses/${id}`)
}

export function createCourse(data: CourseFormData) {
    return http<Course>('/courses', { method: 'POST', body: data })
}

export function updateCourse(id: string, data: CourseFormData) {
    return http<Course>(`/courses/${id}`, { method: 'PUT', body: data })
}

export function deleteCourse(id: string) {
    return http<void>(`/courses/${id}`, { method: 'DELETE' })
}

export function joinCourse(code: string) {
    return http<Course>('/courses/join', { method: 'POST', body: { code } })
}

export function regenerateInviteCode(id: string) {
    return http<Course>(`/courses/${id}/invite-code`, { method: 'POST' })
}

export function listCourseMembers(id: string) {
    return http<CourseMember[]>(`/courses/${id}/members`)
}

export function removeCourseMember(courseId: string, userId: string) {
    return http<void>(`/courses/${courseId}/members/${userId}`, { method: 'DELETE' })
}
