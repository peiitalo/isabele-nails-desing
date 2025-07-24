import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<{ email?: string; password?: string }>({})
  
  const { login, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && user.role && user.role.toLowerCase() === 'admin') {
      navigate('/admin', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError({})

    let hasError = false
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      setError((prev) => ({ ...prev, email: 'Email inválido' }))
      hasError = true
    }
    if (!password) {
      setError((prev) => ({ ...prev, password: 'Senha obrigatória' }))
      hasError = true
    }
    if (hasError) {
      setIsLoading(false)
      return
    }

    try {
      const success = await login(email, password)
      if (success) {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (user.role && user.role.toLowerCase() === 'admin') {
          toast.success('Login de administrador realizado com sucesso!')
          // O redirecionamento será feito pelo useEffect
        } else {
          setError((prev) => ({ ...prev, password: 'Apenas administradores podem acessar aqui.' }))
          toast.error('Apenas administradores podem acessar aqui.')
        }
      } else {
        setError((prev) => ({ ...prev, password: 'Email ou senha incorretos' }))
        toast.error('Email ou senha incorretos')
      }
    } catch (err) {
      setError((prev) => ({ ...prev, password: 'Erro ao fazer login. Tente novamente.' }))
      toast.error('Erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-8 px-2 sm:py-12 sm:px-4 md:px-8 lg:px-16">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-md space-y-8 bg-white bg-opacity-80 rounded-xl shadow-lg p-4 sm:p-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <Sparkles className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
            Login do Administrador
          </h2>
          <p className="mt-2 text-center text-xs sm:text-sm text-gray-600">
            Acesso restrito para administradores
          </p>
        </div>

        <form className="mt-6 sm:mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`input w-full text-sm sm:text-base rounded-t-lg rounded-b-none ${error.email ? 'border-red-500' : ''}`}
                placeholder="Email do administrador"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error.email}
                aria-describedby={error.email ? 'email-error' : undefined}
              />
              {error.email && (
                <p className="text-xs text-red-600 mt-1" id="email-error">{error.email}</p>
              )}
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Senha</label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className={`input w-full text-sm sm:text-base rounded-t-none rounded-b-lg pr-10 ${error.password ? 'border-red-500' : ''}`}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!error.password}
                aria-describedby={error.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
              {error.password && (
                <p className="text-xs text-red-600 mt-1" id="password-error">{error.password}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar como Admin'}
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="text-center mt-2">
              <p className="text-xs sm:text-sm text-gray-600">
                <strong>Credencial de teste:</strong>
              </p>
              <p className="text-xs text-gray-500 mt-1 break-words">
                Admin: admin@isa.com / admin123
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
} 