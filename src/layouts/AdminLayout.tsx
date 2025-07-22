import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import { 
  BarChart3, 
  Calendar, 
  Scissors, 
  Users, 
  LogOut,
  Menu
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: BarChart3 },
    { name: 'Agendamentos', href: '/admin/bookings', icon: Calendar },
    { name: 'Serviços', href: '/admin/services', icon: Scissors },
    { name: 'Clientes', href: '/admin/clients', icon: Users },
    { name: 'Calendário', href: '/admin/calendar', icon: Calendar },
    { name: 'Horários Disponíveis', href: '/admin/working-hours', icon: Calendar },
    { name: 'Dias Especiais', href: '/admin/special-days', icon: Calendar },
  ]

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
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{item.name}</span>
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
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium ${
                          isActive
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon size={18} />
                        <span>{item.name}</span>
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