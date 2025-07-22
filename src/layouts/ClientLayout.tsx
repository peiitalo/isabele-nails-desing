import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import { Home, Scissors, Calendar, User, LogOut, Menu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  const navigation = [
    { name: 'Início', href: '/', icon: Home },
    { name: 'Serviços', href: '/services', icon: Scissors },
    { name: 'Agendar', href: '/booking', icon: Calendar },
    { name: 'Perfil', href: '/profile', icon: User },
  ]

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
                onClick={() => setNavOpen(!navOpen)}
                aria-label="Abrir menu"
              >
                <Menu className="h-6 w-6 text-primary-600" />
              </button>
              <h1 className="text-2xl font-bold text-primary-600">Isa Nails Design</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:inline">Olá, {user.name}</span>
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

      {/* Navegação Desktop */}
      <nav className="bg-white shadow-sm border-b border-gray-200 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    isActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <item.icon size={16} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Navegação Mobile Overlay */}
      <AnimatePresence>
      {navOpen && (
        <motion.div
          className="fixed inset-0 z-40 flex lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setNavOpen(false)}></div>
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
                      onClick={() => setNavOpen(false)}
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
      <main className="max-w-7xl mx-auto flex-1 w-full py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Outlet />
        </div>
      </main>
    </div>
  )
} 