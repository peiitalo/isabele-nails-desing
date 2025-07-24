import { useState, useEffect } from 'react'
import apiService from '../../services/api'
import { Service } from '../../types'
import { 
  Scissors, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Clock,
  DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminServices() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isAddingService, setIsAddingService] = useState(false)
  const [editingService, setEditingService] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: 'manicure' as Service['category'],
    isActive: true
  })
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  const categories = [
    { id: 'all', name: 'Todas' },
    { id: 'manicure', name: 'Manicure' },
    { id: 'pedicure', name: 'Pedicure' },
    { id: 'esmaltação', name: 'Esmaltação' },
    { id: 'decoração', name: 'Decoração' },
  ]

  useEffect(() => {
    async function fetchServices() {
      setLoading(true)
      try {
        const data = await apiService.getServices()
        setServices(data)
      } catch (e) {
        toast.error('Erro ao buscar serviços')
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.description || !formData.price || !formData.duration) {
      toast.error('Por favor, preencha todos os campos obrigatórios')
      return
    }
    try {
      if (editingService) {
        await apiService.updateService(editingService, {
          ...formData,
          price: parseFloat(formData.price),
          duration: parseInt(formData.duration),
        })
        toast.success('Serviço atualizado com sucesso!')
      } else {
        await apiService.createService({
          ...formData,
          price: parseFloat(formData.price),
          duration: parseInt(formData.duration),
        })
        toast.success('Serviço criado com sucesso!')
      }
      setIsAddingService(false)
      setEditingService(null)
      setFormData({ name: '', description: '', price: '', duration: '', category: 'manicure', isActive: true })
      // Atualizar lista
      const data = await apiService.getServices()
      setServices(data)
    } catch (e) {
      toast.error('Erro ao salvar serviço')
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service.id)
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration: service.duration.toString(),
      category: service.category,
      isActive: service.isActive
    })
    setIsAddingService(false)
  }

  const handleDelete = async (serviceId: string) => {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
      try {
        await apiService.deleteService(serviceId)
        toast.success('Serviço excluído com sucesso!')
        setServices(services => services.filter(s => s.id !== serviceId))
      } catch (e) {
        toast.error('Erro ao excluir serviço')
      }
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'manicure':
        return '💅'
      case 'pedicure':
        return '🦶'
      case 'esmaltação':
        return '💎'
      case 'decoração':
        return '✨'
      default:
        return '💅'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'manicure':
        return 'bg-pink-100 text-pink-800'
      case 'pedicure':
        return 'bg-blue-100 text-blue-800'
      case 'esmaltação':
        return 'bg-purple-100 text-purple-800'
      case 'decoração':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Serviços</h1>
          <p className="text-gray-600">
            Gerencie os serviços oferecidos pelo seu negócio
          </p>
        </div>
        <button
          onClick={() => setIsAddingService(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Serviço</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar serviços..."
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div key={service.id} className="card hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{getCategoryIcon(service.category)}</span>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(service.category)}`}>
                  {service.category}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {service.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
            <p className="text-gray-600 mb-4">{service.description}</p>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{service.duration} min</span>
              </div>
              <span className="text-2xl font-bold text-primary-600">
                R$ {service.price.toFixed(2)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleEdit(service)}
                className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm sm:text-base"
              >
                <Edit className="h-4 w-4" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => handleDelete(service.id)}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm sm:text-base"
              >
                <Trash2 className="h-4 w-4" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum serviço encontrado
          </h3>
          <p className="text-gray-600">
            Tente ajustar os filtros ou criar um novo serviço
          </p>
        </div>
      )}

      {/* Add/Edit Service Modal */}
      {(isAddingService || editingService) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Serviço *
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição *
                  </label>
                  <textarea
                    className="input h-20 resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duração (min) *
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    className="input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="MANICURE">Manicure</option>
                    <option value="PEDICURE">Pedicure</option>
                    <option value="ESMALTACAO">Esmaltação</option>
                    <option value="DECORACAO">Decoração</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Serviço ativo
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingService(false)
                      setEditingService(null)
                      setFormData({
                        name: '',
                        description: '',
                        price: '',
                        duration: '',
                        category: 'manicure',
                        isActive: true
                      })
                    }}
                    className="btn-outline"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingService ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 