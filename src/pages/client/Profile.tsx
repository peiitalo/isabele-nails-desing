import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import apiService from '../../services/api'
import { Calendar, Clock, Edit, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, login } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: ''
  })
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true)
      try {
        const data = await apiService.getBookings()
        setBookings(data.filter((b: any) => b.clientId === user.id))
      } catch (e) {
        toast.error('Erro ao buscar agendamentos')
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [user.id])

  const handleEdit = () => setEditMode(true)
  const handleCancel = () => {
    setEditMode(false)
    setForm({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', password: '' })
  }
  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSave = async (e: any) => {
    e.preventDefault()
    try {
      await apiService.updateUser(user.id, { name: form.name, email: form.email, phone: form.phone })
      if (form.password) {
        await apiService.changePassword(user.id, '', form.password)
      }
      toast.success('Perfil atualizado!')
      setEditMode(false)
      await login(form.email, form.password || undefined)
    } catch (err) {
      toast.error('Erro ao atualizar perfil')
    }
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Meu Perfil</h2>
        {editMode ? (
          <form className="space-y-4" onSubmit={handleSave}>
            <div>
              <label className="block text-sm font-medium">Nome</label>
              <input className="input w-full text-base py-3 px-3 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input className="input w-full text-base py-3 px-3 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium">Telefone</label>
              <input className="input w-full text-base py-3 px-3 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" name="phone" value={form.phone} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium">Nova Senha</label>
              <input className="input w-full text-base py-3 px-3 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" name="password" type="password" value={form.password} onChange={handleChange} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex items-center gap-1"><Save size={16}/>Salvar</button>
              <button type="button" className="btn-outline" onClick={handleCancel}>Cancelar</button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            <div><b>Nome:</b> {user.name}</div>
            <div><b>Email:</b> {user.email}</div>
            <div><b>Telefone:</b> {user.phone}</div>
            <button className="btn-outline mt-2 flex items-center gap-1" onClick={handleEdit}><Edit size={16}/>Editar Perfil</button>
          </div>
        )}
      </div>
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Meus Agendamentos</h2>
        {loading ? <div className="text-gray-500">Carregando...</div> : bookings.length === 0 ? (
          <div className="text-gray-500">Nenhum agendamento encontrado.</div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-primary-600" />
                  <div>
                    <div className="font-medium">{booking.serviceName}</div>
                    <div className="text-sm text-gray-600">{new Date(booking.date).toLocaleDateString('pt-BR')} às {booking.time}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>{booking.status}</span>
                  {booking.status === 'pending' && (
                    <button
                      className="btn-outline text-xs"
                      onClick={() => { setCancelId(booking.id); setShowCancelModal(true); }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Modal de cancelamento */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Motivo do cancelamento</h3>
            <textarea
              className="input w-full mb-4"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Descreva o motivo do cancelamento"
            />
            <div className="flex gap-2 justify-end">
              <button className="btn-outline" onClick={() => setShowCancelModal(false)}>Fechar</button>
              <button
                className="btn-primary"
                onClick={async () => {
                  await apiService.updateBookingStatus(cancelId, 'cancelled')
                  await apiService.updateUser(cancelId, { notes: cancelReason })
                  setShowCancelModal(false)
                  setCancelReason('')
                  // Atualizar lista de bookings
                  const data = await apiService.getBookings()
                  setBookings(data)
                }}
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 