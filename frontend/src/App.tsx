import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'

import { useAuthStore } from '@/store/authStore'
import AppShell from '@/components/layout/AppShell'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Jobs from '@/pages/Jobs'
import JobDetail from '@/pages/JobDetail'
import Tracker from '@/pages/Tracker'
import ResumeHub from '@/pages/ResumeHub'
import Settings from '@/pages/Settings'
import Onboarding from '@/pages/Onboarding'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, clearAuth } = useAuthStore()
  const { isError } = useQuery({
    queryKey: ['session-verify'],
    queryFn: () => import('@/api/endpoints').then(m => m.profileApi.get()),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 1000 * 30,
  })

  React.useEffect(() => {
    if (isError) {
      clearAuth()
    }
  }, [isError, clearAuth])

  if (!isAuthenticated || isError) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  return (isAuthenticated && user?.id) ? <Navigate to="/profile" replace /> : <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
              background: '#ffffff',
              color: '#0b1c30',
              border: '1px solid #c7c4d8',
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

          {/* Protected routes — wrapped in AppShell */}
          <Route
            element={<ProtectedRoute><AppShell /></ProtectedRoute>}
          >
            <Route path="/profile" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/tracker" element={<Tracker />} />
            <Route path="/resume" element={<ResumeHub />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
