import { useEffect, useState } from 'react'
import apiService from '../../services/api'
import { 
  BarChart3, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    todayBookings: 0
  })
  const [todayBookings, setTodayBookings] = useState([])
  const [pendingBookings, setPendingBookings] = useState([])
  const [confirmedBookings, setConfirmedBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const statsData = await apiService.getDashboardStats()
        setStats(statsData)
        // Buscar agendamentos de hoje, pendentes e confirmados
        const allBookings = await apiService.getBookings()
        const today = new Date().toISOString().split('T')[0]
        setTodayBookings(allBookings.filter((b: any) => b.date === today))
        setPendingBookings(allBookings.filter((b: any) => b.status === 'pending'))
        setConfirmedBookings(allBookings.filter((b: any) => b.status === 'confirmed'))
      } catch (e) {
        // erro
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Carregando...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Visão geral do seu negócio e agendamentos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Agendamentos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-green-600">+12%</span>
            <span className="text-gray-600 ml-1">vs mês passado</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingBookings}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-yellow-600 font-medium">Requerem atenção</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Concluídos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedBookings}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">91% taxa de conclusão</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {stats.totalRevenue.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-green-600">+8%</span>
            <span className="text-gray-600 ml-1">vs mês passado</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Agendamentos de Hoje */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Agendamentos de Hoje</h2>
          {todayBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum agendamento para hoje</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayBookings.map((booking: any) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(booking.status)}
                    <div>
                      <p className="font-medium">{booking.clientName}</p>
                      <p className="text-sm text-gray-600">{booking.serviceName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{booking.time}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status === 'confirmed' ? 'Confirmado' : 
                       booking.status === 'pending' ? 'Pendente' : 
                       booking.status === 'completed' ? 'Concluído' : 'Cancelado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agendamentos Pendentes */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Agendamentos Pendentes</h2>
          {pendingBookings.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-600">Todos os agendamentos estão confirmados!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingBookings.slice(0, 5).map((booking: any) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">{booking.clientName}</p>
                      <p className="text-sm text-gray-600">{booking.serviceName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.date).toLocaleDateString('pt-BR')} às {booking.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                      Confirmar
                    </button>
                    <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                      Cancelar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Agendamentos Confirmados */}
      <div className="card mt-8">
        <h2 className="text-xl font-semibold mb-4">Agendamentos Confirmados</h2>
        {confirmedBookings.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum agendamento confirmado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {confirmedBookings.slice(0, 5).map((booking: any) => (
              <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">{booking.clientName}</p>
                    <p className="text-sm text-gray-600">{booking.serviceName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(booking.date).toLocaleDateString('pt-BR')} às {booking.time}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                  Confirmado
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gráfico de Receita (simulado) */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Receita dos Últimos 7 Dias</h2>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Gráfico de receita seria exibido aqui</p>
            <p className="text-sm text-gray-500">Integração com biblioteca de gráficos</p>
          </div>
        </div>
      </div>
    </div>
  )
} 