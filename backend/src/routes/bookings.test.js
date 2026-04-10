import Fastify from 'fastify'
import jwt from '@fastify/jwt'
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import prisma from '../database/client.js'
import bookingRoutes from './bookings.js'

let fastify, adminUser, clientUser, testService

beforeAll(async () => {
  fastify = Fastify()
  await fastify.register(jwt, { secret: 'isa-nails-secret-key-change-in-production' })

  async function authMiddleware(request, reply) {
    await request.jwtVerify()
  }
  async function adminMiddleware(request, reply) {
    await request.jwtVerify()
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Acesso negado. Apenas administradores podem acessar este recurso.' })
    }
  }

  fastify.decorate('authenticate', authMiddleware)
  fastify.decorate('adminAuth', adminMiddleware)

  // Register services first for the /api/services prefix
  // Register bookings for the /api/bookings prefix
  await fastify.register(bookingRoutes, { prefix: '/api/bookings' })
  await fastify.ready()
})

afterAll(async () => {
  await fastify.close()
})

async function cleanup() {
  await prisma.booking.deleteMany()
  await prisma.specialDay.deleteMany()
  await prisma.workingHour.deleteMany()
  await prisma.service.deleteMany()
  await prisma.user.deleteMany()
}

beforeEach(cleanup)
afterAll(cleanup)

async function createTestUser(overrides = {}) {
  const role = typeof overrides === 'string' ? overrides : (overrides.role || 'CLIENT')
  const extra = typeof overrides === 'object' ? { ...overrides, role: undefined } : {}
  return prisma.user.create({
    data: {
      name: `Test ${role}`,
      email: `test-booking-${role}-${Date.now()}-${Math.random()}@test.com`,
      phone: '11999999999',
      password: 'hashed_password',
      role,
      ...extra
    }
  })
}

function login(user) {
  return fastify.jwt.sign({ id: user.id, email: user.email, role: user.role })
}

async function createTestService(overrides = {}) {
  return prisma.service.create({
    data: {
      name: 'Serviço Teste',
      description: 'Descrição do serviço',
      price: 50,
      duration: 60,
      category: 'MANICURE',
      isActive: true,
      ...overrides
    }
  })
}

// ===================== GET /api/bookings/availability/:date =====================

describe('GET /api/bookings/availability/:date', () => {
  it('deve retornar slots de 30 minutos com base no horário de trabalho', async () => {
    await prisma.workingHour.create({
      data: { weekday: 1, startTime: '09:00', endTime: '12:00' }
    })
    // Monday 2026-04-06
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/availability/2026-04-06'
    })
    expect(res.statusCode).toBe(200)
    const slots = res.json()
    expect(slots.length).toBe(6) // 9:00, 9:30, 10:00, 10:30, 11:00, 11:30
    expect(slots[0].time).toBe('09:00')
    expect(slots[5].time).toBe('11:30')
  })

  it('deve usar dias especiais quando houver configuração especial', async () => {
    await prisma.specialDay.create({
      data: { date: '2026-04-06', startTime: '14:00', endTime: '17:00' }
    })
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/availability/2026-04-06'
    })
    expect(res.statusCode).toBe(200)
    const slots = res.json()
    expect(slots.length).toBe(6) // 14:00, 14:30, 15:00, 15:30, 16:00, 16:30
    expect(slots[0].time).toBe('14:00')
  })

  it('deve bloquear slots ocupados por agendamentos confirmados', async () => {
    const user = await createTestUser()
    await prisma.workingHour.create({
      data: { weekday: 1, startTime: '09:00', endTime: '12:00' }
    })
    const service = await createTestService({ duration: 60 })
    await prisma.booking.create({
      data: {
        clientId: user.id,
        serviceId: service.id,
        date: '2026-04-06',
        time: '10:00',
        status: 'CONFIRMED'
      }
    })
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/availability/2026-04-06'
    })
    expect(res.statusCode).toBe(200)
    const slots = res.json()
    const slot10 = slots.find(s => s.time === '10:00')
    const slot1030 = slots.find(s => s.time === '10:30')
    expect(slot10.available).toBe(false)
    expect(slot1030.available).toBe(false)
    const slot09 = slots.find(s => s.time === '09:00')
    expect(slot09.available).toBe(true)
  })

  it('deve bloquear slots de um serviço longo que ultrapassa múltiplos intervalos', async () => {
    const user = await createTestUser()
    await prisma.workingHour.create({
      data: { weekday: 1, startTime: '09:00', endTime: '13:00' }
    })
    const service = await createTestService({ name: 'Serviço Longo', duration: 90 })
    await prisma.booking.create({
      data: {
        clientId: user.id,
        serviceId: service.id,
        date: '2026-04-06',
        time: '10:00',
        status: 'CONFIRMED'
      }
    })
    const res = await fastify.inject({
      method: 'GET',
      url: `/api/bookings/availability/2026-04-06?serviceId=${service.id}`
    })
    expect(res.statusCode).toBe(200)
    const slots = res.json()
    const slot10 = slots.find(s => s.time === '10:00')
    const slot1030 = slots.find(s => s.time === '10:30')
    const slot11 = slots.find(s => s.time === '11:00')
    expect(slot10.available).toBe(false)
    expect(slot1030.available).toBe(false)
    expect(slot11.available).toBe(false)
    const slot1130 = slots.find(s => s.time === '11:30')
    expect(slot1130.available).toBe(true)
  })

  it('deve ignorar agendamentos CANCELLED na disponibilidade', async () => {
    const user = await createTestUser()
    await prisma.workingHour.create({
      data: { weekday: 1, startTime: '09:00', endTime: '12:00' }
    })
    const service = await createTestService()
    await prisma.booking.create({
      data: {
        clientId: user.id,
        serviceId: service.id,
        date: '2026-04-06',
        time: '10:00',
        status: 'CANCELLED'
      }
    })
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/availability/2026-04-06'
    })
    expect(res.statusCode).toBe(200)
    const slots = res.json()
    const slot10 = slots.find(s => s.time === '10:00')
    expect(slot10.available).toBe(true)
  })
})

// ===================== POST /api/bookings/ =====================

describe('POST /api/bookings/', () => {
  it('deve retornar 401 sem autenticação', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { serviceId: '123', date: '2026-04-06', time: '10:00' }
    })
    expect(res.statusCode).toBe(401)
  })

  it('deve criar agendamento como PENDING para cliente', async () => {
    const client = await createTestUser('CLIENT')
    const service = await createTestService()
    const token = login(client)
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/bookings',
      headers: { authorization: `Bearer ${token}` },
      payload: { serviceId: service.id, date: '2026-04-06', time: '10:00' }
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.status).toBe('PENDING')
    expect(body.clientId).toBe(client.id)
    expect(body.serviceId).toBe(service.id)
    expect(body.createdBy).toBe('CLIENT')
  })

  it('deve criar agendamento como CONFIRMED para admin', async () => {
    const admin = await createTestUser('ADMIN')
    const service = await createTestService()
    const token = login(admin)
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/bookings',
      headers: { authorization: `Bearer ${token}` },
      payload: { serviceId: service.id, date: '2026-04-07', time: '14:00' }
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.status).toBe('CONFIRMED')
    expect(body.createdBy).toBe('ADMIN')
  })

  it('deve retornar 404 para serviço inexistente', async () => {
    const client = await createTestUser()
    const token = login(client)
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/bookings',
      headers: { authorization: `Bearer ${token}` },
      payload: { serviceId: 'nonexistent', date: '2026-04-06', time: '10:00' }
    })
    expect(res.statusCode).toBe(404)
  })

  it('deve retornar 400 para serviço inativo', async () => {
    const client = await createTestUser()
    const service = await createTestService({ isActive: false })
    const token = login(client)
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/bookings',
      headers: { authorization: `Bearer ${token}` },
      payload: { serviceId: service.id, date: '2026-04-06', time: '10:00' }
    })
    expect(res.statusCode).toBe(400)
  })

  it('deve retornar 400 se horário já está ocupado', async () => {
    const client = await createTestUser()
    const service = await createTestService()
    await prisma.booking.create({
      data: {
        clientId: client.id,
        serviceId: service.id,
        date: '2026-04-06',
        time: '10:00',
        status: 'CONFIRMED'
      }
    })
    const token = login(client)
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/bookings',
      headers: { authorization: `Bearer ${token}` },
      payload: { serviceId: service.id, date: '2026-04-06', time: '10:00' }
    })
    expect(res.statusCode).toBe(400)
  })
})

// ===================== GET /api/bookings/ =====================

describe('GET /api/bookings/', () => {
  it('deve retornar 401 sem autenticação', async () => {
    const res = await fastify.inject({ method: 'GET', url: '/api/bookings' })
    expect(res.statusCode).toBe(401)
  })

  it('deve retornar apenas agendamentos do cliente logado', async () => {
    const client1 = await createTestUser('CLIENT')
    const client2 = await createTestUser('CLIENT')
    const service = await createTestService()

    await prisma.booking.createMany({
      data: [
        { clientId: client1.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'PENDING' },
        { clientId: client2.id, serviceId: service.id, date: '2026-04-06', time: '11:00', status: 'PENDING' }
      ]
    })

    const token1 = login(client1)
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings',
      headers: { authorization: `Bearer ${token1}` }
    })
    expect(res.statusCode).toBe(200)
    const bookings = res.json()
    expect(bookings.length).toBe(1)
    expect(bookings[0].clientId).toBe(client1.id)
  })

  it('admin deve ver todos os agendamentos', async () => {
    const admin = await createTestUser('ADMIN')
    const client = await createTestUser('CLIENT')
    const service = await createTestService()
    await prisma.booking.create({
      data: { clientId: client.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'PENDING' }
    })
    const token = login(admin)
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().length).toBe(1)
  })
})

// ===================== GET /api/bookings/:id =====================

describe('GET /api/bookings/:id', () => {
  it('cliente pode ver seu próprio agendamento', async () => {
    const client = await createTestUser()
    const service = await createTestService()
    const booking = await prisma.booking.create({
      data: { clientId: client.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'PENDING' }
    })
    const token = login(client)
    const res = await fastify.inject({
      method: 'GET',
      url: `/api/bookings/${booking.id}`,
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().id).toBe(booking.id)
  })

  it('cliente NÃO pode ver agendamento de outro', async () => {
    const c1 = await createTestUser({ email: 'g1@test.com' })
    const c2 = await createTestUser({ email: 'g2@test.com' })
    const service = await createTestService()
    const booking = await prisma.booking.create({
      data: { clientId: c2.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'PENDING' }
    })
    const token = login(c1)
    const res = await fastify.inject({
      method: 'GET',
      url: `/api/bookings/${booking.id}`,
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(403)
  })
})

// ===================== DELETE /api/bookings/:id =====================

describe('DELETE /api/bookings/:id (cancelar)', () => {
  it('cliente pode cancelar seu próprio agendamento PENDING', async () => {
    const client = await createTestUser()
    const service = await createTestService()
    const booking = await prisma.booking.create({
      data: { clientId: client.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'PENDING' }
    })
    const token = login(client)
    const res = await fastify.inject({
      method: 'DELETE',
      url: `/api/bookings/${booking.id}`,
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(204)
    const updated = await prisma.booking.findUnique({ where: { id: booking.id } })
    expect(updated.status).toBe('CANCELLED')
  })

  it('cliente NÃO pode cancelar agendamento CONFIRMED', async () => {
    const client = await createTestUser()
    const service = await createTestService()
    const booking = await prisma.booking.create({
      data: { clientId: client.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'CONFIRMED' }
    })
    const token = login(client)
    const res = await fastify.inject({
      method: 'DELETE',
      url: `/api/bookings/${booking.id}`,
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(403)
  })

  it('cliente NÃO pode cancelar agendamento de outro cliente', async () => {
    const c1 = await createTestUser({ email: 'dc1@test.com' })
    const c2 = await createTestUser({ email: 'dc2@test.com' })
    const service = await createTestService()
    const booking = await prisma.booking.create({
      data: { clientId: c2.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'PENDING' }
    })
    const token = login(c1)
    const res = await fastify.inject({
      method: 'DELETE',
      url: `/api/bookings/${booking.id}`,
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(403)
  })

  it('deve retornar 404 para agendamento inexistente', async () => {
    const client = await createTestUser()
    const token = login(client)
    const res = await fastify.inject({
      method: 'DELETE',
      url: '/api/bookings/nonexistent',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(404)
  })
})

// ===================== PATCH /api/bookings/:id/status =====================

describe('PATCH /api/bookings/:id/status', () => {
  it('deve retornar 401 sem autenticação', async () => {
    const res = await fastify.inject({
      method: 'PATCH',
      url: '/api/bookings/some-id/status',
      payload: { status: 'CONFIRMED' }
    })
    expect(res.statusCode).toBe(401)
  })

  it('cliente não pode alterar status (só admin)', async () => {
    const client = await createTestUser('CLIENT')
    const token = login(client)
    const res = await fastify.inject({
      method: 'PATCH',
      url: '/api/bookings/some-id/status',
      headers: { authorization: `Bearer ${token}` },
      payload: { status: 'CONFIRMED' }
    })
    expect(res.statusCode).toBe(403)
  })

  it('admin pode alterar status de agendamento', async () => {
    const admin = await createTestUser('ADMIN')
    const client = await createTestUser('CLIENT')
    const service = await createTestService()
    const booking = await prisma.booking.create({
      data: { clientId: client.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'PENDING' }
    })
    const token = login(admin)
    const res = await fastify.inject({
      method: 'PATCH',
      url: `/api/bookings/${booking.id}/status`,
      headers: { authorization: `Bearer ${token}` },
      payload: { status: 'CONFIRMED' }
    })
    expect(res.statusCode).toBe(200)
    const updated = await prisma.booking.findUnique({ where: { id: booking.id } })
    expect(updated.status).toBe('CONFIRMED')
  })
})

// ===================== PATCH /api/bookings/:id/payment =====================

describe('PATCH /api/bookings/:id/payment', () => {
  it('apenas admin pode registrar pagamento', async () => {
    const client = await createTestUser('CLIENT')
    const token = login(client)
    const res = await fastify.inject({
      method: 'PATCH',
      url: '/api/bookings/some-id/payment',
      headers: { authorization: `Bearer ${token}` },
      payload: { paymentStatus: 'PAID', paymentMethod: 'PIX' }
    })
    expect(res.statusCode).toBe(403)
  })

  it('admin pode registrar pagamento', async () => {
    const admin = await createTestUser('ADMIN')
    const client = await createTestUser('CLIENT')
    const service = await createTestService()
    const booking = await prisma.booking.create({
      data: { clientId: client.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'COMPLETED' }
    })
    const token = login(admin)
    const res = await fastify.inject({
      method: 'PATCH',
      url: `/api/bookings/${booking.id}/payment`,
      headers: { authorization: `Bearer ${token}` },
      payload: { paymentStatus: 'PAID', paymentMethod: 'PIX' }
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.paymentStatus).toBe('PAID')
    expect(body.paymentMethod).toBe('PIX')
  })
})

// ===================== GET /api/bookings/stats/dashboard =====================

describe('GET /api/bookings/stats/dashboard', () => {
  it('deve retornar 403 para não-admin', async () => {
    const client = await createTestUser()
    const token = login(client)
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/stats/dashboard',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(403)
  })

  it('deve retornar estatísticas corretas para admin', async () => {
    const admin = await createTestUser('ADMIN')
    const client = await createTestUser('CLIENT')
    const service = await createTestService({ price: 100 })
    await prisma.booking.createMany({
      data: [
        { clientId: client.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'PENDING' },
        { clientId: client.id, serviceId: service.id, date: '2026-04-06', time: '11:00', status: 'CONFIRMED' },
        { clientId: client.id, serviceId: service.id, date: '2026-04-06', time: '12:00', status: 'COMPLETED' }
      ]
    })
    const token = login(admin)
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/stats/dashboard',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.totalBookings).toBe(3)
    expect(body.pendingBookings).toBe(1)
    expect(body.completedBookings).toBe(1)
    expect(body.totalRevenue).toBe(100)
  })
})

// ===================== Working Hours CRUD =====================

describe('Working Hours CRUD', () => {
  it('deve criar horário de trabalho (admin)', async () => {
    const admin = await createTestUser('ADMIN')
    const token = login(admin)
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/bookings/working-hours',
      headers: { authorization: `Bearer ${token}` },
      payload: { weekday: 1, startTime: '08:00', endTime: '18:00' }
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.weekday).toBe(1)
    expect(body.startTime).toBe('08:00')
  })

  it('deve listar horários de trabalho (admin)', async () => {
    const admin = await createTestUser('ADMIN')
    await prisma.workingHour.createMany({
      data: [
        { weekday: 1, startTime: '09:00', endTime: '17:00' },
        { weekday: 2, startTime: '09:00', endTime: '17:00' }
      ]
    })
    const token = login(admin)
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/working-hours',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().length).toBe(2)
  })

  it('deve atualizar horário de trabalho (admin)', async () => {
    const admin = await createTestUser('ADMIN')
    const hour = await prisma.workingHour.create({
      data: { weekday: 1, startTime: '09:00', endTime: '17:00' }
    })
    const token = login(admin)
    const res = await fastify.inject({
      method: 'PUT',
      url: `/api/bookings/working-hours/${hour.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { weekday: 1, startTime: '10:00', endTime: '18:00' }
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().startTime).toBe('10:00')
    expect(res.json().endTime).toBe('18:00')
  })

  it('deve deletar horário de trabalho (admin)', async () => {
    const admin = await createTestUser('ADMIN')
    const hour = await prisma.workingHour.create({
      data: { weekday: 1, startTime: '09:00', endTime: '17:00' }
    })
    const token = login(admin)
    const res = await fastify.inject({
      method: 'DELETE',
      url: `/api/bookings/working-hours/${hour.id}`,
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(204)
    const exists = await prisma.workingHour.findUnique({ where: { id: hour.id } })
    expect(exists).toBe(null)
  })

  it('apenas admin pode gerenciar horários', async () => {
    const client = await createTestUser('CLIENT')
    const token = login(client)
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/bookings/working-hours',
      headers: { authorization: `Bearer ${token}` },
      payload: { weekday: 1, startTime: '08:00', endTime: '18:00' }
    })
    expect(res.statusCode).toBe(403)
  })
})

// ===================== Special Days CRUD =====================

describe('Special Days CRUD', () => {
  it('deve criar dia especial (admin)', async () => {
    const admin = await createTestUser('ADMIN')
    const token = login(admin)
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/bookings/special-days',
      headers: { authorization: `Bearer ${token}` },
      payload: { date: '2026-12-25', startTime: '09:00', endTime: '14:00' }
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.date).toBe('2026-12-25')
  })

  it('deve listar dias especiais (admin)', async () => {
    const admin = await createTestUser('ADMIN')
    await prisma.specialDay.create({
      data: { date: '2026-12-25', startTime: '09:00', endTime: '14:00' }
    })
    const token = login(admin)
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/special-days',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().length).toBe(1)
  })

  it('deve atualizar dia especial (admin)', async () => {
    const admin = await createTestUser('ADMIN')
    const day = await prisma.specialDay.create({
      data: { date: '2026-12-25', startTime: '09:00', endTime: '14:00' }
    })
    const token = login(admin)
    const res = await fastify.inject({
      method: 'PUT',
      url: `/api/bookings/special-days/${day.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { date: '2026-12-25', startTime: '10:00', endTime: '15:00' }
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().startTime).toBe('10:00')
  })

  it('deve deletar dia especial (admin)', async () => {
    const admin = await createTestUser('ADMIN')
    const day = await prisma.specialDay.create({
      data: { date: '2026-12-25', startTime: '09:00', endTime: '14:00' }
    })
    const token = login(admin)
    const res = await fastify.inject({
      method: 'DELETE',
      url: `/api/bookings/special-days/${day.id}`,
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(204)
  })

  it('apenas admin pode gerenciar dias especiais', async () => {
    const client = await createTestUser('CLIENT')
    const token = login(client)
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/special-days',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(403)
  })
})
