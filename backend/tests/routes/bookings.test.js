/**
 * Tests for GET    /api/bookings/availability/:date
 *          POST   /api/bookings/
 *          GET    /api/bookings/
 *          GET    /api/bookings/:id
 *          DELETE /api/bookings/:id       (cancel)
 *          PATCH  /api/bookings/:id/status
 *          PATCH  /api/bookings/:id/payment
 *          GET    /api/bookings/stats/dashboard
 *          Working Hours CRUD (GET/POST/PUT/DELETE /api/bookings/working-hours)
 *          Special Days CRUD  (GET/POST/PUT/DELETE /api/bookings/special-days)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { buildApp, cleanup, createTestUser, createTestService, loginToken } from '../helpers/setup.js'
import prisma from '../../src/database/client.js'
import bookingRoutes from '../../src/routes/bookings.js'

let fastify

beforeAll(async () => {
  await cleanup()
  fastify = await buildApp(bookingRoutes, '/api/bookings')
})

afterAll(async () => {
  await cleanup()
  await fastify.close()
})

beforeEach(cleanup)

// ===================== GET /api/bookings/availability/:date =====================

describe('GET /api/bookings/availability/:date', () => {
  it('deve retornar slots de 30 minutos com base no horario de trabalho', async () => {
    // weekday 1 = Monday; 2026-04-06 is a Monday
    await prisma.workingHour.create({
      data: { weekday: 1, startTime: '09:00', endTime: '12:00' }
    })

    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/availability/2026-04-06'
    })

    expect(res.statusCode).toBe(200)
    const slots = res.json()
    // 09:00, 09:30, 10:00, 10:30, 11:00, 11:30 => 6 slots
    expect(slots.length).toBe(6)
    expect(slots[0].time).toBe('09:00')
    expect(slots[5].time).toBe('11:30')
  })

  it('deve usar dias especiais quando houver configuracao especial', async () => {
    await prisma.specialDay.create({
      data: { date: '2026-04-06', startTime: '14:00', endTime: '17:00' }
    })

    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/availability/2026-04-06'
    })

    expect(res.statusCode).toBe(200)
    const slots = res.json()
    // 14:00, 14:30, 15:00, 15:30, 16:00, 16:30 => 6 slots
    expect(slots.length).toBe(6)
    expect(slots[0].time).toBe('14:00')
  })

  it('deve bloquear slots ocupados por agendamentos confirmados', async () => {
    const user = await createTestUser({ role: 'CLIENT' })
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
    // Booking at 10:00 with 60 min duration occupies 10:00 and 10:30
    const slot10   = slots.find(s => s.time === '10:00')
    const slot1030 = slots.find(s => s.time === '10:30')
    const slot09   = slots.find(s => s.time === '09:00')
    expect(slot10.available).toBe(false)
    expect(slot1030.available).toBe(false)
    expect(slot09.available).toBe(true)
  })

  it('deve bloquear slots de servico longo que ocupa multiplos intervalos', async () => {
    const user = await createTestUser({ role: 'CLIENT' })
    await prisma.workingHour.create({
      data: { weekday: 1, startTime: '09:00', endTime: '13:00' }
    })
    const service = await createTestService({ name: 'Servico Longo', duration: 90 })
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
    // 90 min booking at 10:00 occupies 10:00, 10:30, 11:00
    // A new 90-min service starting at 10:00/10:30/11:00 would overlap
    const slot10   = slots.find(s => s.time === '10:00')
    const slot1030 = slots.find(s => s.time === '10:30')
    const slot11   = slots.find(s => s.time === '11:00')
    expect(slot10.available).toBe(false)
    expect(slot1030.available).toBe(false)
    expect(slot11.available).toBe(false)
    // 11:30 has enough room (11:30, 12:00, 12:30 are all free)
    const slot1130 = slots.find(s => s.time === '11:30')
    expect(slot1130.available).toBe(true)
  })

  it('deve ignorar agendamentos CANCELLED na disponibilidade', async () => {
    const user = await createTestUser({ role: 'CLIENT' })
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
    const slot10 = res.json().find(s => s.time === '10:00')
    expect(slot10.available).toBe(true)
  })

  it('deve retornar lista vazia quando nao ha horario de trabalho configurado', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/availability/2026-04-06'
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().length).toBe(0)
  })

  it('deve aceitar parametro date via query string (/availability?date=...)', async () => {
    await prisma.workingHour.create({
      data: { weekday: 1, startTime: '09:00', endTime: '11:00' }
    })

    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/availability?date=2026-04-06'
    })

    expect(res.statusCode).toBe(200)
    const slots = res.json()
    expect(slots.length).toBe(4)
    expect(slots[0].time).toBe('09:00')
  })

  it('deve aceitar data no formato ISO completo com timezone', async () => {
    await prisma.workingHour.create({
      data: { weekday: 1, startTime: '09:00', endTime: '11:00' }
    })

    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/availability?date=2026-04-06T00:00:00.000Z'
    })

    expect(res.statusCode).toBe(200)
    const slots = res.json()
    expect(slots.length).toBe(4)
  })

  it('deve retornar 400 se data nao for enviada no endpoint sem path param', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/availability'
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Data não informada')
  })

  it('deve suportar o alias /available-slots?date=...', async () => {
    await prisma.workingHour.create({
      data: { weekday: 1, startTime: '10:00', endTime: '12:00' }
    })

    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/available-slots?date=2026-04-06'
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().length).toBe(4)
  })
})

// ===================== POST /api/bookings/ =====================

describe('POST /api/bookings/', () => {
  it('deve retornar 401 sem autenticacao', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { serviceId: '123', date: '2026-04-06', time: '10:00' }
    })

    expect(res.statusCode).toBe(401)
  })

  it('deve criar agendamento como PENDING para cliente', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const service = await createTestService()
    const token = loginToken(fastify, client)

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
    const admin = await createTestUser({ role: 'ADMIN' })
    const service = await createTestService()
    const token = loginToken(fastify, admin)

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

  it('deve retornar 404 para servico inexistente', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'POST',
      url: '/api/bookings',
      headers: { authorization: `Bearer ${token}` },
      payload: { serviceId: 'nonexistent', date: '2026-04-06', time: '10:00' }
    })

    expect(res.statusCode).toBe(404)
  })

  it('deve retornar 400 para servico inativo', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const service = await createTestService({ isActive: false })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'POST',
      url: '/api/bookings',
      headers: { authorization: `Bearer ${token}` },
      payload: { serviceId: service.id, date: '2026-04-06', time: '10:00' }
    })

    expect(res.statusCode).toBe(400)
  })

  it('deve retornar 400 se horario ja esta ocupado', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
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
    const token = loginToken(fastify, client)

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
  it('deve retornar 401 sem autenticacao', async () => {
    const res = await fastify.inject({ method: 'GET', url: '/api/bookings' })
    expect(res.statusCode).toBe(401)
  })

  it('deve retornar apenas agendamentos do cliente logado', async () => {
    const client1 = await createTestUser({ role: 'CLIENT', email: 'gc1@test.com' })
    const client2 = await createTestUser({ role: 'CLIENT', email: 'gc2@test.com' })
    const service = await createTestService()

    await prisma.booking.createMany({
      data: [
        { clientId: client1.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'PENDING' },
        { clientId: client2.id, serviceId: service.id, date: '2026-04-06', time: '11:00', status: 'PENDING' }
      ]
    })

    const token1 = loginToken(fastify, client1)
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
    const admin = await createTestUser({ role: 'ADMIN' })
    const client = await createTestUser({ role: 'CLIENT', email: 'ga-client@test.com' })
    const service = await createTestService()
    await prisma.booking.create({
      data: { clientId: client.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'PENDING' }
    })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings',
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().length).toBe(1)
  })

  it('admin pode filtrar agendamentos por clientId', async () => {
    const admin = await createTestUser({ role: 'ADMIN' })
    const c1 = await createTestUser({ role: 'CLIENT', email: 'fc1@test.com' })
    const c2 = await createTestUser({ role: 'CLIENT', email: 'fc2@test.com' })
    const service = await createTestService()
    await prisma.booking.createMany({
      data: [
        { clientId: c1.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'PENDING' },
        { clientId: c2.id, serviceId: service.id, date: '2026-04-06', time: '11:00', status: 'PENDING' }
      ]
    })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'GET',
      url: `/api/bookings?clientId=${c1.id}`,
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().length).toBe(1)
    expect(res.json()[0].clientId).toBe(c1.id)
  })
})

// ===================== GET /api/bookings/:id =====================

describe('GET /api/bookings/:id', () => {
  it('cliente pode ver seu proprio agendamento', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const service = await createTestService()
    const booking = await prisma.booking.create({
      data: { clientId: client.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'PENDING' }
    })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'GET',
      url: `/api/bookings/${booking.id}`,
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().id).toBe(booking.id)
  })

  it('cliente NAO pode ver agendamento de outro', async () => {
    const c1 = await createTestUser({ email: 'g1@test.com' })
    const c2 = await createTestUser({ email: 'g2@test.com' })
    const service = await createTestService()
    const booking = await prisma.booking.create({
      data: { clientId: c2.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'PENDING' }
    })
    const token = loginToken(fastify, c1)

    const res = await fastify.inject({
      method: 'GET',
      url: `/api/bookings/${booking.id}`,
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(403)
  })

  it('deve retornar 404 para agendamento inexistente', async () => {
    const admin = await createTestUser({ role: 'ADMIN' })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/nonexistent-id',
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(404)
  })
})

// ===================== DELETE /api/bookings/:id (cancelar) =====================

describe('DELETE /api/bookings/:id (cancelar)', () => {
  it('cliente pode cancelar seu proprio agendamento PENDING', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const service = await createTestService()
    const booking = await prisma.booking.create({
      data: { clientId: client.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'PENDING' }
    })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'DELETE',
      url: `/api/bookings/${booking.id}`,
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(204)
    const updated = await prisma.booking.findUnique({ where: { id: booking.id } })
    expect(updated.status).toBe('CANCELLED')
  })

  it('cliente NAO pode cancelar agendamento CONFIRMED', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const service = await createTestService()
    const booking = await prisma.booking.create({
      data: { clientId: client.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'CONFIRMED' }
    })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'DELETE',
      url: `/api/bookings/${booking.id}`,
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(403)
  })

  it('cliente NAO pode cancelar agendamento de outro cliente', async () => {
    const c1 = await createTestUser({ email: 'dc1@test.com' })
    const c2 = await createTestUser({ email: 'dc2@test.com' })
    const service = await createTestService()
    const booking = await prisma.booking.create({
      data: { clientId: c2.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'PENDING' }
    })
    const token = loginToken(fastify, c1)

    const res = await fastify.inject({
      method: 'DELETE',
      url: `/api/bookings/${booking.id}`,
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(403)
  })

  it('deve retornar 404 para agendamento inexistente', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'DELETE',
      url: '/api/bookings/nonexistent-id',
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(404)
  })
})

// ===================== PATCH /api/bookings/:id/status =====================

describe('PATCH /api/bookings/:id/status', () => {
  it('deve retornar 401 sem autenticacao', async () => {
    const res = await fastify.inject({
      method: 'PATCH',
      url: '/api/bookings/some-id/status',
      payload: { status: 'CONFIRMED' }
    })

    expect(res.statusCode).toBe(401)
  })

  it('cliente nao pode alterar status (apenas admin)', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'PATCH',
      url: '/api/bookings/some-id/status',
      headers: { authorization: `Bearer ${token}` },
      payload: { status: 'CONFIRMED' }
    })

    expect(res.statusCode).toBe(403)
  })

  it('admin pode alterar status de agendamento', async () => {
    const admin = await createTestUser({ role: 'ADMIN' })
    const client = await createTestUser({ role: 'CLIENT', email: 'status-client@test.com' })
    const service = await createTestService()
    const booking = await prisma.booking.create({
      data: { clientId: client.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'PENDING' }
    })
    const token = loginToken(fastify, admin)

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

  it('deve retornar 404 ao tentar alterar status de agendamento inexistente', async () => {
    const admin = await createTestUser({ role: 'ADMIN' })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'PATCH',
      url: '/api/bookings/nonexistent-id/status',
      headers: { authorization: `Bearer ${token}` },
      payload: { status: 'CONFIRMED' }
    })

    expect(res.statusCode).toBe(404)
  })
})

// ===================== PATCH /api/bookings/:id/payment =====================

describe('PATCH /api/bookings/:id/payment', () => {
  it('apenas admin pode registrar pagamento', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'PATCH',
      url: '/api/bookings/some-id/payment',
      headers: { authorization: `Bearer ${token}` },
      payload: { paymentStatus: 'PAID', paymentMethod: 'PIX' }
    })

    expect(res.statusCode).toBe(403)
  })

  it('admin pode registrar pagamento', async () => {
    const admin = await createTestUser({ role: 'ADMIN' })
    const client = await createTestUser({ role: 'CLIENT', email: 'pay-client@test.com' })
    const service = await createTestService()
    const booking = await prisma.booking.create({
      data: { clientId: client.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'COMPLETED' }
    })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'PATCH',
      url: `/api/bookings/${booking.id}/payment`,
      headers: { authorization: `Bearer ${token}` },
      payload: { paymentStatus: 'PAID', paymentMethod: 'PIX' }
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().paymentStatus).toBe('PAID')
    expect(res.json().paymentMethod).toBe('PIX')
  })

  it('deve retornar 404 para agendamento inexistente', async () => {
    const admin = await createTestUser({ role: 'ADMIN' })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'PATCH',
      url: '/api/bookings/nonexistent-id/payment',
      headers: { authorization: `Bearer ${token}` },
      payload: { paymentStatus: 'PAID' }
    })

    expect(res.statusCode).toBe(404)
  })
})

// ===================== GET /api/bookings/stats/dashboard =====================

describe('GET /api/bookings/stats/dashboard', () => {
  it('deve retornar 403 para nao-admin', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/stats/dashboard',
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(403)
  })

  it('deve retornar estatisticas corretas para admin', async () => {
    const admin = await createTestUser({ role: 'ADMIN' })
    const client = await createTestUser({ role: 'CLIENT', email: 'dash-client@test.com' })
    const service = await createTestService({ price: 100 })

    await prisma.booking.createMany({
      data: [
        { clientId: client.id, serviceId: service.id, date: '2026-04-06', time: '10:00', status: 'PENDING' },
        { clientId: client.id, serviceId: service.id, date: '2026-04-06', time: '11:00', status: 'CONFIRMED' },
        { clientId: client.id, serviceId: service.id, date: '2026-04-06', time: '12:00', status: 'COMPLETED' }
      ]
    })

    const token = loginToken(fastify, admin)
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
  it('deve criar horario de trabalho (admin)', async () => {
    const admin = await createTestUser({ role: 'ADMIN' })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'POST',
      url: '/api/bookings/working-hours',
      headers: { authorization: `Bearer ${token}` },
      payload: { weekday: 1, startTime: '08:00', endTime: '18:00' }
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().weekday).toBe(1)
    expect(res.json().startTime).toBe('08:00')
  })

  it('deve listar horarios de trabalho (admin)', async () => {
    const admin = await createTestUser({ role: 'ADMIN' })
    await prisma.workingHour.createMany({
      data: [
        { weekday: 1, startTime: '09:00', endTime: '17:00' },
        { weekday: 2, startTime: '09:00', endTime: '17:00' }
      ]
    })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/working-hours',
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().length).toBe(2)
  })

  it('deve atualizar horario de trabalho (admin)', async () => {
    const admin = await createTestUser({ role: 'ADMIN' })
    const hour = await prisma.workingHour.create({
      data: { weekday: 1, startTime: '09:00', endTime: '17:00' }
    })
    const token = loginToken(fastify, admin)

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

  it('deve deletar horario de trabalho (admin)', async () => {
    const admin = await createTestUser({ role: 'ADMIN' })
    const hour = await prisma.workingHour.create({
      data: { weekday: 1, startTime: '09:00', endTime: '17:00' }
    })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'DELETE',
      url: `/api/bookings/working-hours/${hour.id}`,
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(204)
    const exists = await prisma.workingHour.findUnique({ where: { id: hour.id } })
    expect(exists).toBe(null)
  })

  it('apenas admin pode gerenciar horarios', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const token = loginToken(fastify, client)

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
    const admin = await createTestUser({ role: 'ADMIN' })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'POST',
      url: '/api/bookings/special-days',
      headers: { authorization: `Bearer ${token}` },
      payload: { date: '2026-12-25', startTime: '09:00', endTime: '14:00' }
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().date).toBe('2026-12-25')
  })

  it('deve listar dias especiais (admin)', async () => {
    const admin = await createTestUser({ role: 'ADMIN' })
    await prisma.specialDay.create({
      data: { date: '2026-12-25', startTime: '09:00', endTime: '14:00' }
    })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/special-days',
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().length).toBe(1)
  })

  it('deve atualizar dia especial (admin)', async () => {
    const admin = await createTestUser({ role: 'ADMIN' })
    const day = await prisma.specialDay.create({
      data: { date: '2026-12-25', startTime: '09:00', endTime: '14:00' }
    })
    const token = loginToken(fastify, admin)

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
    const admin = await createTestUser({ role: 'ADMIN' })
    const day = await prisma.specialDay.create({
      data: { date: '2026-12-25', startTime: '09:00', endTime: '14:00' }
    })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'DELETE',
      url: `/api/bookings/special-days/${day.id}`,
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(204)
  })

  it('apenas admin pode gerenciar dias especiais', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'GET',
      url: '/api/bookings/special-days',
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(403)
  })
})
