import { Service, Booking, DashboardStats } from '../types'

export const mockServices: Service[] = [
  {
    id: '1',
    name: 'Manicure Completa',
    description: 'Cutilagem, lixamento, hidratação e esmaltação',
    price: 35.00,
    duration: 60,
    category: 'manicure',
    isActive: true
  },
  {
    id: '2',
    name: 'Pedicure Completa',
    description: 'Cutilagem, lixamento, hidratação e esmaltação',
    price: 40.00,
    duration: 75,
    category: 'pedicure',
    isActive: true
  },
  {
    id: '3',
    name: 'Esmaltação em Gel',
    description: 'Aplicação de esmalte em gel com secagem',
    price: 45.00,
    duration: 45,
    category: 'esmaltação',
    isActive: true
  },
  {
    id: '4',
    name: 'Decoração Simples',
    description: 'Aplicação de decorações simples nas unhas',
    price: 15.00,
    duration: 30,
    category: 'decoração',
    isActive: true
  },
  {
    id: '5',
    name: 'Decoração Avançada',
    description: 'Decorações complexas com pedras e desenhos',
    price: 25.00,
    duration: 45,
    category: 'decoração',
    isActive: true
  },
  {
    id: '6',
    name: 'Manicure + Pedicure',
    description: 'Pacote completo de manicure e pedicure',
    price: 65.00,
    duration: 120,
    category: 'manicure',
    isActive: true
  }
]

export const mockBookings: Booking[] = [
  {
    id: '1',
    clientId: '2',
    clientName: 'Maria Silva',
    clientPhone: '(11) 88888-8888',
    serviceId: '1',
    serviceName: 'Manicure Completa',
    servicePrice: 35.00,
    date: '2024-01-15',
    time: '14:00',
    status: 'confirmed',
    notes: 'Preferência por esmalte rosa',
    createdAt: '2024-01-10T10:00:00Z'
  },
  {
    id: '2',
    clientId: '3',
    clientName: 'Ana Costa',
    clientPhone: '(11) 77777-7777',
    serviceId: '3',
    serviceName: 'Esmaltação em Gel',
    servicePrice: 45.00,
    date: '2024-01-15',
    time: '16:00',
    status: 'pending',
    createdAt: '2024-01-11T14:30:00Z'
  },
  {
    id: '3',
    clientId: '4',
    clientName: 'Joana Santos',
    clientPhone: '(11) 66666-6666',
    serviceId: '6',
    serviceName: 'Manicure + Pedicure',
    servicePrice: 65.00,
    date: '2024-01-16',
    time: '10:00',
    status: 'completed',
    createdAt: '2024-01-09T09:15:00Z'
  }
]

export const mockDashboardStats: DashboardStats = {
  totalBookings: 156,
  pendingBookings: 8,
  completedBookings: 142,
  totalRevenue: 5240.00,
  todayBookings: 3
}

export const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30'
] 