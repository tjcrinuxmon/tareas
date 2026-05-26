import React, { useState, useCallback, useEffect } from 'react'
import BrandLogo from './components/BrandLogo.jsx'
import Sidebar from './components/Sidebar.jsx'
import TaskList from './components/TaskList.jsx'
import TaskDetail from './components/TaskDetail.jsx'
import TaskForm from './components/TaskForm.jsx'
import ReportView from './components/ReportView.jsx'
import CalendarReport from './components/CalendarReport.jsx'
import EnlaceReports from './components/EnlaceReports.jsx'
import LoginPage from './components/LoginPage.jsx'
import NotificationBell from './components/NotificationBell.jsx'
import UserManagement from './components/UserManagement.jsx'
import ConveniosView from './components/ConveniosView.jsx'
import ConveniosReport from './components/ConveniosReport.jsx'
import DALView from './components/DALView.jsx'
import { getToken, getUser, setAuth, clearAuth } from './auth.js'

const ROLE_LABELS = {
  admin:       'Administrador',
  ejecutiva:   'Dir. Ejecutiva',
  director:    'Director/a',
  subdirector: 'Subdirector/a',
  secretaria:  'Secretaría Particular',
}

export default function App() {
  const [token, setToken] = useState(() => getToken())
  const [user, setUser] = useState(() => getUser())
  // True while an SSO token in the URL is being exchanged — prevents LoginPage
  // from redirecting to portal before the exchange completes.
  const [ssoLoading, setSsoLoading] = useState(
    () => !!new URLSearchParams(window.location.search).get('sso_token')
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ssoToken = params.get('sso_token')
    if (!ssoToken) return
    fetch('/api/auth/sso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sso_token: ssoToken }),
    })
      .then(r => r.json())
      .then(({ token: t, user: u }) => {
        if (t) {
          setAuth(t, u)
          setToken(t)
          setUser(u)
          setView('tasks')
          setSelectedTaskId(null)
          setEditingTask(null)
          setFilters({
            direccion: (u?.role === 'director' || u?.role === 'subdirector') ? (u?.direccion || '') : '',
            status: '',
            date_from: '',
            date_to: '',
            priority: '',
          })
          setRefreshKey(k => k + 1)
          window.history.replaceState({}, '', '/')
        }
        setSsoLoading(false)
      })
      .catch(() => setSsoLoading(false))
  }, [])

  const [view, setView] = useState('tasks')
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [filters, setFilters] = useState(() => {
    const u = getUser()
    return {
      direccion: (u?.role === 'director' || u?.role === 'subdirector') ? (u?.direccion || '') : '',
      status: '',
      date_from: '',
      date_to: '',
      priority: '',
    }
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  const navigate = useCallback((newView, params = {}) => {
    setView(newView)
    if (params.taskId !== undefined) setSelectedTaskId(params.taskId)
    if (params.task !== undefined) setEditingTask(params.task)
  }, [])

  const handleFilterChange = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setView('tasks')
  }, [])

  const handleLogin = (tok, usr) => {
    setAuth(tok, usr)
    setToken(tok)
    setUser(usr)
    setView('tasks')
    setSelectedTaskId(null)
    setEditingTask(null)
    setFilters({
      direccion: (usr?.role === 'director' || usr?.role === 'subdirector') ? (usr?.direccion || '') : '',
      status: '',
      date_from: '',
      date_to: '',
      priority: '',
    })
    setRefreshKey((k) => k + 1)
  }

  const handleLogout = () => {
    clearAuth()
    setToken(null)
    setUser(null)
    setView('tasks')
  }

  if (ssoLoading) return (
    <div className="flex items-center justify-center h-screen bg-ine-bg">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-ine-border border-t-ine-purple rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-ine-dim">Iniciando sesión…</p>
      </div>
    </div>
  )

  if (!token || !user) return <LoginPage onLogin={handleLogin} />

  return (
    <div className="flex h-screen overflow-hidden bg-ine-bg">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onNavigate={navigate}
        currentView={view}
        user={user}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top navigation bar — INE style: white with bottom border */}
        <header
          className="bg-white flex items-center px-5 gap-3 flex-shrink-0"
          style={{
            height: '60px',
            borderBottom: '1px solid #E2D9EE',
            boxShadow: '0 1px 4px rgba(0,0,0,.06)',
          }}
        >
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-2 rounded-lg text-ine-muted hover:text-ine-purple hover:bg-ine-bg transition-colors"
            title="Menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* INE Brand */}
          <div className="flex items-center gap-2.5">
            <BrandLogo size={32} />
            <div className="hidden sm:block">
              <p className="text-sm font-black text-ine-purple leading-none">INE · DEAJ</p>
              <p className="text-xs text-ine-muted leading-none mt-0.5">Seguimiento de Tareas</p>
            </div>
          </div>

          {/* Breadcrumb */}
          {view !== 'tasks' && view !== 'report' && view !== 'calendar' && (
            <div className="hidden md:flex items-center gap-1 text-ine-dim text-xs ml-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>{{
                'task-detail':   'Detalle de Tarea',
                'new-task':      'Nueva Tarea',
                'edit-task':     'Editar Tarea',
                'users':         'Gestión de Usuarios',
                'enlace':        'Seguimiento Diario',
                'convenios':        'Seguimiento de Convenios',
                'convenios-report': 'Reportes de Convenios',
                'dal':              'Asuntos Laborales',
                'dal-dashboard':    'Dashboard Laborales',
              }[view] || ''}</span>
            </div>
          )}

          <div className="flex-1" />

          {/* Notification Bell */}
          <NotificationBell onNavigateTask={(id) => navigate('task-detail', { taskId: id })} />

          {/* CTA: Nueva Tarea */}
          {view === 'tasks' && (
            <button onClick={() => navigate('new-task')} className="btn-ine">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Nueva Tarea</span>
            </button>
          )}

          {(view === 'task-detail' || view === 'edit-task') && (
            <button onClick={() => navigate('tasks')} className="btn-outline">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Volver</span>
            </button>
          )}

          {/* User */}
          <div className="flex items-center gap-2.5 pl-4" style={{ borderLeft: '1px solid #E2D9EE' }}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: '#582E73' }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block leading-none">
              <p className="text-xs font-semibold text-ine-text truncate max-w-[110px]">{user.name}</p>
              <p className="text-xs text-ine-dim mt-0.5">
                {ROLE_LABELS[user.role] || 'Usuario'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Volver al portal"
              className="p-1.5 rounded-lg text-ine-dim hover:text-ine-purple hover:bg-ine-bg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto min-h-0 p-3 sm:p-6">
          {view === 'tasks' && (
            <TaskList
              key={refreshKey}
              filters={filters}
              onFilterChange={handleFilterChange}
              onTaskClick={(id) => navigate('task-detail', { taskId: id })}
              onNewTask={() => navigate('new-task')}
              user={user}
            />
          )}
          {view === 'task-detail' && (
            <TaskDetail
              taskId={selectedTaskId}
              onBack={() => navigate('tasks')}
              onEdit={(task) => navigate('edit-task', { task })}
              onDeleted={() => { refresh(); navigate('tasks') }}
              onRefresh={refresh}
              user={user}
            />
          )}
          {view === 'new-task' && (
            <TaskForm
              onCancel={() => navigate('tasks')}
              onSaved={(task) => { refresh(); navigate('task-detail', { taskId: task.id }) }}
              initialFilters={filters}
              user={user}
            />
          )}
          {view === 'edit-task' && (
            <TaskForm
              task={editingTask}
              onCancel={() => navigate('task-detail', { taskId: editingTask?.id })}
              onSaved={(task) => { refresh(); navigate('task-detail', { taskId: task.id }) }}
              initialFilters={filters}
              user={user}
            />
          )}
          {view === 'report' && <ReportView user={user} />}
          {view === 'calendar' && <CalendarReport />}
          {view === 'enlace' && (user?.role === 'admin' || user?.role === 'ejecutiva' || user?.direccion === 'enlace_interinstitucional') && <EnlaceReports user={user} />}
{view === 'users' && user?.role === 'admin' && <UserManagement />}
          {view === 'convenios' && (user?.role === 'admin' || user?.role === 'ejecutiva' || user?.role === 'secretaria' || user?.direccion === 'contratos_convenios') && <ConveniosView user={user} />}
          {view === 'convenios-report' && user?.role === 'admin' && <ConveniosReport />}
          {view === 'dal' && (user?.role === 'admin' || user?.role === 'ejecutiva' || user?.direccion === 'asuntos_laborales') && <DALView user={user} />}
          {view === 'dal-dashboard' && (user?.role === 'admin' || user?.role === 'ejecutiva') && <DALView user={user} dashboardOnly />}
        </main>

        {/* Footer */}
        <footer
          className="px-6 py-3 flex items-center justify-between flex-shrink-0"
          style={{ background: '#2A1239' }}
        >
          <div className="flex items-center gap-2">
            <BrandLogo size={16} className="opacity-50" />
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,.55)' }}>
              INE · DEAJ — Dirección Ejecutiva de Asuntos Jurídicos
            </span>
          </div>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,.35)' }}>
            © {new Date().getFullYear()} Instituto Nacional Electoral
          </span>
        </footer>
      </div>
    </div>
  )
}
