import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await login(email, password)
      if (success) {
        toast.success('Login realizado com sucesso!')
        // Redirecionar baseado no papel do usuário
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        console.log('👤 Usuário logado:', user)
        console.log('🎭 Role:', user.role)
        
        if (user.role === 'ADMIN') {
          console.log('🚀 Redirecionando para /admin')
          // Usar window.location como fallback
          setTimeout(() => {
            window.location.href = '/admin'
          }, 100)
        } else {
          console.log('🚀 Redirecionando para /')
          // Usar window.location como fallback
          setTimeout(() => {
            window.location.href = '/'
          }, 100)
        }
      } else {
        toast.error('Email ou senha incorretos')
      }
    } catch (error) {
      toast.error('Erro ao fazer login')
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
            Isa Nails Design
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Faça login para acessar sua conta
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input rounded-t-lg rounded-b-none w-full text-base py-3 px-3 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="input rounded-t-none rounded-b-lg pr-10 w-full text-base py-3 px-3 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mt-4">
              Não tem conta? <a href="/register" className="text-primary-600 hover:underline">Cadastre-se</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
} 