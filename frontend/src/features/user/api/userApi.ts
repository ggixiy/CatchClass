import { http } from '@/shared/api/http'

export interface UserProfile {
  id: string
  email: string
  displayName: string
  photoUrl: string | null
  bannerUrl: string | null
}

export function getMyProfile() {
  return http<UserProfile>('/users/me')
}

export function updateMyProfile(displayName: string) {
  return http<UserProfile>('/users/me', { method: 'PUT', body: { displayName } })
}

export function uploadMyPhoto(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return http<UserProfile>('/users/me/photo', { method: 'POST', body: formData })
}

export function deleteMyPhoto() {
  return http<UserProfile>('/users/me/photo', { method: 'DELETE' })
}

export function uploadMyBanner(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return http<UserProfile>('/users/me/banner', { method: 'POST', body: formData })
}

export function deleteMyBanner() {
  return http<UserProfile>('/users/me/banner', { method: 'DELETE' })
}
