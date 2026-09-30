import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ForgotPasswordPage, LoginPage, ResetPasswordPage, SignUpPage, VerifyEmailPage } from '@/features/auth'
import { ProfilePage } from '@/features/user'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/profile" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignUpPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  { path: '/profile', element: <ProfilePage /> },
])