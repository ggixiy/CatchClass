import { createBrowserRouter } from 'react-router-dom'
import { ForgotPasswordPage, LoginPage, ResetPasswordPage, SignUpPage, VerifyEmailPage } from '@/features/auth'
import { HomePage } from '@/features/meeting'
import { MeetingRoomPage, WaitingRoomPage } from '@/features/room'
import { ProfilePage } from '@/features/user'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignUpPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  { path: '/profile', element: <ProfilePage /> },
  { path: '/waiting/:meetingId', element: <WaitingRoomPage /> },
  { path: '/room/:meetingId', element: <MeetingRoomPage /> },
])