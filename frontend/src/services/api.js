const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  // Método para fazer requisições HTTP
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`

    // Configurações padrão
    let headers = { ...options.headers };
    // Só adiciona Content-Type se houver body
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }
    const config = {
      method: options.method || 'GET',
      headers,
      credentials: 'include',
      ...options
    }

    try {
      const response = await fetch(url, config)

      // Se a resposta não for ok, lançar erro
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`)
      }

      // Se a resposta for 204 (No Content), retornar null
      if (response.status === 204) {
        return null
      }

      const data = await response.json()
      return data
    } catch (error) {
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
    if (typeof status === 'object') {
      // Permite enviar { status, notes }
      return this.request(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(status)
      })
    }
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

  async updateBookingPayment(id, paymentStatus, paymentMethod) {
    return this.request(`/bookings/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus, paymentMethod })
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