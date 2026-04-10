import { useState, useEffect } from 'react'
import apiService from '../../services/api'
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Phone,
  Calendar,
  DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminClients() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const sortOptions = [
    { value: 'name', label: 'Nome' },
    { value: 'totalBookings', label: 'Total de Agendamentos' },
    { value: 'totalSpent', label: 'Valor Total' },
    { value: 'lastVisit', label: 'Última Visita' },
    { value: 'createdAt', label: 'Data de Cadastro' },
  ]

  useEffect(() => {
    async function fetchClients() {
      setLoading(true)
      try {
        const data = await apiService.getUsers({ role: 'CLIENT' })
        setClients(data)
      } catch (e) {
        toast.error('Erro ao buscar clientes')
      } finally {
        setLoading(false)
      }
    }
    fetchClients()
  }, [])

  const filteredClients = clients
    .filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Carregando...</div>
  }

  const handleEdit = async (client: any) => {
    // Exemplo: abrir modal de edição (implementar modal se desejar)
    // await apiService.updateUser(client.id, { ... })
    toast('Funcionalidade de edição de cliente pode ser implementada aqui.')
  }
  const handleDelete = async (clientId: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await apiService.deleteUser(clientId)
        toast.success('Cliente excluído com sucesso!')
        setClients(clients => clients.filter(c => c.id !== clientId))
      } catch (e) {
        toast.error('Erro ao excluir cliente')
      }
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Clientes</h1>
            <p className="text-gray-600">
              Gerencie a base de clientes do seu negócio
            </p>
          </div>
          <button className="btn-primary flex items-center space-x-2" onClick={() => setShowCreateUserModal(true)}>
            <Plus className="h-4 w-4" />
            <span>Novo Cliente</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou telefone..."
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
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    Ordenar por: {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Cadastro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 text-xs sm:text-sm">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {client.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Cliente desde {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.email}</div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      {client.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-primary-600 hover:text-primary-900 p-1 sm:p-2" onClick={() => handleEdit(client)}>
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-blue-600 hover:text-blue-900 p-1 sm:p-2" onClick={() => handleEdit(client)}>
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 p-1 sm:p-2" onClick={() => handleDelete(client.id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum cliente encontrado
              </h3>
              <p className="text-gray-600">
                Tente ajustar os filtros ou criar um novo cliente
              </p>
            </div>
          )}
        </div>
      </div>
      {showCreateUserModal && (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-bold mb-2">Novo Cliente</h3>
        <input className="input w-full mb-2" placeholder="Nome" value={createUserForm.name} onChange={e => setCreateUserForm(f => ({ ...f, name: e.target.value }))} />
        <input className="input w-full mb-2" placeholder="Email" value={createUserForm.email} onChange={e => setCreateUserForm(f => ({ ...f, email: e.target.value }))} />
        <input className="input w-full mb-2" placeholder="Telefone" value={createUserForm.phone} onChange={e => setCreateUserForm(f => ({ ...f, phone: e.target.value }))} />
        <input className="input w-full mb-2" placeholder="Senha" type="password" value={createUserForm.password} onChange={e => setCreateUserForm(f => ({ ...f, password: e.target.value }))} />
        <div className="flex gap-2 justify-end">
          <button className="btn-outline" onClick={() => setShowCreateUserModal(false)}>Fechar</button>
          <button
            className="btn-primary"
            onClick={async () => {
              await apiService.register(createUserForm)
              setShowCreateUserModal(false)
              setCreateUserForm({ name: '', email: '', phone: '', password: '' })
              // Atualizar lista de clientes
              const data = await apiService.getUsers({ role: 'CLIENT' })
              setClients(data)
              toast.success('Cliente cadastrado com sucesso!')
            }}
          >
            Cadastrar
          </button>
        </div>
      </div>
    </div>
  )}
    </>
  )
} 