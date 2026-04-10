export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'CLIENT' | 'ADMIN'
  createdAt: string
}

export interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number // em minutos
  category: 'MANICURE' | 'PEDICURE' | 'ESMALTACAO' | 'DECORACAO'
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
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  paymentStatus: 'PAID' | 'UNPAID'
  paymentMethod: 'PIX' | 'CASH' | 'CARD' | null
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