const API_BASE_URL = 'http://localhost:3333/api'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  // Método para fazer requisições HTTP
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    console.log('🌐 Fazendo requisição para:', url)
    console.log('📤 Dados enviados:', options.body)
    console.log('📤 Método:', options.method || 'GET')
    
    // Adicionar token de autenticação se existir
    const token = localStorage.getItem('token')
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    }

    // Configurações padrão
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    console.log('🔧 Configuração final:', config)

    try {
      const response = await fetch(url, config)
      
      console.log('📥 Status da resposta:', response.status)
      console.log('📥 Headers da resposta:', response.headers)
      
      // Se a resposta não for ok, lançar erro
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Erro na resposta:', errorData)
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`)
      }

      // Se a resposta for 204 (No Content), retornar null
      if (response.status === 204) {
        return null
      }

      const data = await response.json()
      console.log('✅ Dados recebidos:', data)
      return data
    } catch (error) {
      console.error('❌ API Error:', error)
      throw error
    }
  }

  // Métodos de autenticação
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  }

  async getCurrentUser() {
    return this.request('/auth/me')
  }

  // Métodos de serviços
  async getServices(filters = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/services?${params}`)
  }

  async getService(id) {
    return this.request(`/services/${id}`)
  }

  async createService(serviceData) {
    return this.request('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData)
    })
  }

  async updateService(id, serviceData) {
    return this.request(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData)
    })
  }

  async deleteService(id) {
    return this.request(`/services/${id}`, {
      method: 'DELETE'
    })
  }

  // Métodos de agendamentos
  async getBookings(filters = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/bookings?${params}`)
  }

  async getBooking(id) {
    return this.request(`/bookings/${id}`)
  }

  async createBooking(bookingData) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    })
  }

  async updateBookingStatus(id, status) {
    return this.request(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  }

  async cancelBooking(id) {
    return this.request(`/bookings/${id}`, {
      method: 'DELETE'
    })
  }

  async updateBookingNotes(id, notes) {
    return this.request(`/bookings/${id}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes })
    })
  }

  async getAvailableSlots(date, serviceId) {
    let url = `/bookings/availability/${date}`;
    if (serviceId) {
      url += `?serviceId=${serviceId}`;
    }
    return this.request(url)
  }

  // Métodos de usuários
  async getUsers(filters = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/users?${params}`)
  }

  async getUser(id) {
    return this.request(`/users/${id}`)
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    })
  }

  async changePassword(id, currentPassword, newPassword) {
    return this.request(`/users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword })
    })
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE'
    })
  }

  // Métodos de estatísticas
  async getDashboardStats() {
    return this.request('/bookings/stats/dashboard')
  }

  async getServiceStats() {
    return this.request('/services/stats/overview')
  }

  async getUserStats() {
    return this.request('/users/stats/overview')
  }

  // Horários de trabalho (admin)
  async getWorkingHours() {
    return this.request('/bookings/working-hours')
  }
  async createWorkingHour(data) {
    return this.request('/bookings/working-hours', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  async updateWorkingHour(id, data) {
    return this.request(`/bookings/working-hours/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }
  async deleteWorkingHour(id) {
    return this.request(`/bookings/working-hours/${id}`, {
      method: 'DELETE'
    })
  }

  // Dias especiais (admin)
  async getSpecialDays() {
    return this.request('/bookings/special-days')
  }
  async createSpecialDay(data) {
    return this.request('/bookings/special-days', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  async updateSpecialDay(id, data) {
    return this.request(`/bookings/special-days/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }
  async deleteSpecialDay(id) {
    return this.request(`/bookings/special-days/${id}`, {
      method: 'DELETE'
    })
  }
}

// Criar instância única do serviço
const apiService = new ApiService()

export default apiService 