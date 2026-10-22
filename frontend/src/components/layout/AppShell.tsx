import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/endpoints'
import {
  Briefcase, KanbanSquare,
  FileText, User, Bell, LogOut, Sparkles, Menu
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { Settings as SettingsIcon } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/profile',   icon: User,            label: 'Profile' },
  { to: '/jobs',      icon: Briefcase,       label: 'Job Search' },
  { to: '/tracker',   icon: KanbanSquare,    label: 'Tracker' },
  { to: '/resume',    icon: FileText,        label: 'Resume' },
  { to: '/settings',  icon: SettingsIcon,    label: 'Settings' },
]

export default function AppShell() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch { /* ignore */ }
    clearAuth()
    navigate('/login')
    toast.success('Logged out')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-background)' }}>
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className="flex flex-col shrink-0 transition-all duration-300 border-r"
        style={{
          width: collapsed ? 72 : 260,
          background: 'var(--color-surface-container-lowest)',
          borderColor: 'var(--color-outline-variant)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'var(--color-outline-variant)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
               style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-base tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
              HireMatch<span style={{ color: 'var(--color-primary)' }}> AI</span>
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: user avatar + logout */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--color-outline-variant)' }}>
          {!collapsed && (
            <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-lg"
                 style={{ background: 'var(--color-surface-container-low)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
                   style={{ background: 'var(--color-primary-container)', color: 'var(--color-on-primary)' }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-on-surface)' }}>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--color-on-surface-variant)' }}>{user?.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="nav-item w-full"
            style={{ color: 'var(--color-error)' }}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 h-16 border-b shrink-0"
                style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-outline-variant)' }}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: 'var(--color-on-surface-variant)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-container-low)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--color-on-surface)' }}>
              {/* Page title injected by each page via document.title */}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: 'var(--color-surface-container)' }}>
              <Bell className="w-5 h-5" style={{ color: 'var(--color-on-surface-variant)' }} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-primary)]" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
