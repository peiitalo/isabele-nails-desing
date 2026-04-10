import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'client'
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-2 sm:px-4 md:px-8 lg:px-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-xs sm:text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    // Se for rota de admin, redireciona para /admin/login
    if (requiredRole === 'admin') {
      return <Navigate to="/admin/login" replace state={{ from: location }} />
    }
    // Se for rota de cliente ou pública, redireciona para /login
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Se o usuário for admin e tentar acessar rota de cliente, redireciona para /admin
  if (user.role && user.role.toLowerCase() === 'admin' && requiredRole === 'client') {
    return <Navigate to="/admin" replace />
  }

  // Se o usuário for cliente e tentar acessar rota de admin, redireciona para /login
  if (user.role && user.role.toLowerCase() === 'client' && requiredRole === 'admin') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
} 