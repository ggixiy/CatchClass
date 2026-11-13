import { createBrowserRouter } from 'react-router-dom'
import { ForgotPasswordPage, LoginPage, ResetPasswordPage, SignUpPage, VerifyEmailPage } from '@/features/auth'
import { HomePage } from '@/features/meeting'
import { CoursePage, CoursesPage, JoinCoursePage } from '@/features/course'
import { JoinLinkPage, MeetingRoomPage, PreJoinLobby, WaitingRoomPage } from '@/features/room'
import { AppLayout } from '@/shared/layout/AppLayout'
import { DashboardPage } from '@/features/analytics'
import { ProfilePage } from '@/features/user'
import { NotFoundPage } from './NotFoundPage'

export const router = createBrowserRouter([{
  element: <AppLayout />,
  children: [
  { path: '/', element: <HomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignUpPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  { path: '/courses', element: <CoursesPage /> },
  { path: '/courses/:courseId', element: <CoursePage /> },
  { path: '/join-course/:code', element: <JoinCoursePage /> },
  { path: '/courses/:courseId/dashboard', element: <DashboardPage /> },
  { path: '/profile', element: <ProfilePage /> },
  { path: '/join/:publicId', element: <JoinLinkPage /> },
  { path: '/prejoin', element: <PreJoinLobby /> },
  { path: '/waiting/:meetingId', element: <WaitingRoomPage /> },
  { path: '/room/:meetingId', element: <MeetingRoomPage /> },
  { path: '*', element: <NotFoundPage /> },
]},
])
