import { useState, useEffect } from 'react'
import apiService from '../../services/api'
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Edit,
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminBookings() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    clientId: '',
    serviceId: '',
    date: '',
    time: '',
    notes: ''
  })
  const [clients, setClients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { user } = useAuth();

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendentes' },
    { value: 'confirmed', label: 'Confirmados' },
    { value: 'completed', label: 'Concluídos' },
    { value: 'cancelled', label: 'Cancelados' },
  ]

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true)
      try {
        const data = await apiService.getBookings()
        setBookings(data)
      } catch (e) {
        toast.error('Erro ao buscar agendamentos')
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  useEffect(() => {
    if (showCreateModal) {
      apiService.getUsers({ role: 'CLIENT' }).then(setClients)
      apiService.getServices().then(setServices)
    }
  }, [showCreateModal])

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.clientPhone?.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      await apiService.updateBookingStatus(bookingId, newStatus)
      toast.success(`Status alterado para ${newStatus}`)
      setBookings(bookings => bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b))
    } catch (e) {
      toast.error('Erro ao atualizar status')
    }
  }

  const handleDelete = async (bookingId: string) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      try {
        await apiService.cancelBooking(bookingId)
        toast.success('Agendamento excluído com sucesso!')
        setBookings(bookings => bookings.filter(b => b.id !== bookingId))
      } catch (e) {
        toast.error('Erro ao excluir agendamento')
      }
    }
  }

  const handleCreate = async () => {
    try {
      // Se o admin está criando, já cria como confirmado
      const bookingData = { ...createForm, status: 'confirmed' };
      await apiService.createBooking(bookingData)
      setShowCreateModal(false)
      setCreateForm({ clientId: '', serviceId: '', date: '', time: '', notes: '' })
      const data = await apiService.getBookings()
      setBookings(data)
      toast.success('Agendamento criado com sucesso!')
    } catch (e) {
      toast.error('Erro ao criar agendamento')
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado'
      case 'pending':
        return 'Pendente'
      case 'completed':
        return 'Concluído'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Carregando...</div>
  }

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agendamentos</h1>
          <p className="text-gray-600">
            Gerencie todos os agendamentos do seu negócio
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          Novo Agendamento
        </button>
      </div>

      {/* Modal de criação de agendamento */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">Novo Agendamento</h3>
            <select
              className="input w-full mb-2"
              value={createForm.clientId}
              onChange={e => setCreateForm(f => ({ ...f, clientId: e.target.value }))}
            >
              <option value="">Selecione o cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name} - {c.email}</option>)}
            </select>
            <select
              className="input w-full mb-2"
              value={createForm.serviceId}
              onChange={e => setCreateForm(f => ({ ...f, serviceId: e.target.value }))}
            >
              <option value="">Selecione o serviço</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input
              className="input w-full mb-2"
              type="date"
              value={createForm.date}
              onChange={e => setCreateForm(f => ({ ...f, date: e.target.value }))}
            />
            <input
              className="input w-full mb-2"
              type="time"
              value={createForm.time}
              onChange={e => setCreateForm(f => ({ ...f, time: e.target.value }))}
            />
            <textarea
              className="input w-full mb-2"
              placeholder="Notas"
              value={createForm.notes}
              onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))}
            />
            <div className="flex gap-2 justify-end">
              <button className="btn-outline" onClick={() => setShowCreateModal(false)}>Fechar</button>
              <button className="btn-primary" onClick={handleCreate}>
                Criar Agendamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, serviço ou telefone..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Serviço
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data & Horário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50 text-xs sm:text-sm">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.clientName}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {booking.clientPhone}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{booking.serviceName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {new Date(booking.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-2 mt-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{booking.time}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    R$ {booking.servicePrice?.toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedBooking(booking.id)}
                      className="text-primary-600 hover:text-primary-900 p-1 sm:p-2"
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {/* Mostra aceitar/recusar para qualquer agendamento pendente */}
                    {(booking.status?.toLowerCase() === 'pending') && (
                      <>
                        <button
                          onClick={() => handleStatusChange(booking.id, 'CONFIRMED')}
                          className="text-green-600 hover:text-green-900 p-1 sm:p-2"
                          title="Aceitar"
                        >
                          Aceitar
                        </button>
                        <button
                          onClick={() => { setRejectId(booking.id); setShowRejectModal(true); }}
                          className="text-yellow-600 hover:text-yellow-900 p-1 sm:p-2"
                          title="Recusar"
                        >
                          Recusar
                        </button>
                      </>
                    )}
                    {/* Mostra cancelar para pendentes e confirmados */}
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <button
                        onClick={() => { setRejectId(booking.id); setShowRejectModal(true); }}
                        className="text-yellow-600 hover:text-yellow-900 p-1 sm:p-2"
                        title="Cancelar"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(booking.id)}
                      className="text-red-600 hover:text-red-900 p-1 sm:p-2"
                      title="Excluir"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum agendamento encontrado
          </h3>
          <p className="text-gray-600">
            Tente ajustar os filtros ou termos de busca
          </p>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Detalhes do Agendamento
              </h3>
              {(() => {
                const booking = bookings.find(b => b.id === selectedBooking)
                if (!booking) return null
                return (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cliente</label>
                      <p className="text-gray-900">{booking.clientName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Telefone</label>
                      <p className="text-gray-900">{booking.clientPhone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Serviço</label>
                      <p className="text-gray-900">{booking.serviceName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Data</label>
                      <p className="text-gray-900">
                        {new Date(booking.date).toLocaleDateString('pt-BR')} às {booking.time}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Valor</label>
                      <p className="text-gray-900">R$ {booking.servicePrice?.toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                    {booking.notes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Observações</label>
                        <p className="text-gray-900">{booking.notes}</p>
                      </div>
                    )}
                  </div>
                )
              })()}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="btn-outline"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para motivo da recusa */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Motivo do cancelamento</h3>
            <textarea
              className="input w-full mb-4"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Descreva o motivo do cancelamento"
            />
            <div className="flex gap-2 justify-end">
              <button className="btn-outline" onClick={() => setShowRejectModal(false)}>Fechar</button>
              <button
                className="btn-primary"
                onClick={async () => {
                  // Atualiza status para cancelled e salva o motivo no campo notes em uma única chamada
                  await apiService.updateBookingStatus(rejectId, { status: 'CANCELLED', notes: rejectReason });
                  setShowRejectModal(false);
                  setRejectReason('');
                  // Atualizar lista de bookings
                  const data = await apiService.getBookings();
                  setBookings(data);
                }}
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 