export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'client' | 'admin'
  createdAt: string
}

export interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number // em minutos
  category: 'manicure' | 'pedicure' | 'esmaltação' | 'decoração'
  isActive: boolean
}

export interface Booking {
  id: string
  clientId: string
  clientName: string
  clientPhone: string
  serviceId: string
  serviceName: string
  servicePrice: number
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  createdAt: string
}

export interface TimeSlot {
  time: string
  available: boolean
  bookingId?: string
}

export interface DashboardStats {
  totalBookings: number
  pendingBookings: number
  completedBookings: number
  totalRevenue: number
  todayBookings: number
} 