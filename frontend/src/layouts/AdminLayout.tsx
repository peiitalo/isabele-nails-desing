import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import {
  BarChart3,
  Calendar,
  Scissors,
  Users,
  LogOut,
  Menu,
  Bell
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLayout() {
  const { user, isLoading, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  // Polling de agendamentos pendentes (a cada 30s) para atualizar o badge e notificações
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const apiService = (await import('../services/api')).default
        const data = await apiService.getBookings()
        setPendingCount(data.filter((b: any) => b.status?.toUpperCase() === 'PENDING').length)
      } catch {
        // erro silencioso para o badge
      }
    }
    fetchPending()
    const interval = setInterval(fetchPending, 30_000)
    return () => clearInterval(interval)
  }, [])

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: BarChart3, badge: pendingCount },
    { name: 'Agendamentos', href: '/admin/bookings', icon: Calendar, badge: pendingCount > 0 ? pendingCount : undefined },
    { name: 'Serviços', href: '/admin/services', icon: Scissors },
    { name: 'Clientes', href: '/admin/clients', icon: Users },
    { name: 'Calendário', href: '/admin/calendar', icon: Calendar },
    { name: 'Horários Disponíveis', href: '/admin/working-hours', icon: Calendar },
    { name: 'Dias Especiais', href: '/admin/special-days', icon: Calendar },
  ]

  // Ainda carregando auth — não redirecionar
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Verificar se o usuário é admin
  if (!user || (user.role && user.role.toLowerCase() !== 'admin')) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {/* Menu mobile */}
              <button
                className="lg:hidden mr-3 p-2 rounded hover:bg-gray-100 focus:outline-none"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Abrir menu"
              >
                <Menu className="h-6 w-6 text-primary-600" />
              </button>
              <h1 className="text-2xl font-bold text-primary-600">Isa Nails Design - Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Sino de notificações pendentes */}
              <Link
                to="/admin/bookings"
                className="relative p-2 rounded hover:bg-gray-100 focus:outline-none"
                title="Agendamentos pendentes"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {pendingCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full px-1 min-w-[1rem] text-center leading-tight">
                    {pendingCount}
                  </span>
                )}
              </Link>
              <span className="text-sm text-gray-600 hidden sm:inline">Admin: {user.name}</span>
              <button
                onClick={logout}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
              >
                <LogOut size={16} />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:block w-64 bg-white shadow-sm border-r border-gray-200">
          <nav className="mt-8">
            <div className="px-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center justify-between space-x-3 px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon size={18} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>
        </aside>

        {/* Sidebar Mobile Overlay */}
        <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setSidebarOpen(false)}></div>
            <motion.aside
              className="relative w-64 bg-white shadow-xl border-r border-gray-200 z-50 animate-slide-in"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <nav className="mt-8">
                <div className="px-4 space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center justify-between space-x-3 px-3 py-2 rounded-md text-sm font-medium ${
                          isActive
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon size={18} />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && item.badge > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </nav>
            </motion.aside>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 