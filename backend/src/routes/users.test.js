import Fastify from 'fastify'
import bcrypt from 'bcryptjs'
import jwt from '@fastify/jwt'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import prisma from '../database/client.js'
import userRoutes from './users.js'

let fastify

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

  await fastify.register(userRoutes, { prefix: '/api/users' })
  await fastify.ready()
})

afterAll(async () => {
  await fastify.close()
})

async function cleanup() {
  await prisma.booking.deleteMany()
  await prisma.user.deleteMany()
}

beforeEach(cleanup)
afterAll(cleanup)

async function createTestUser(overrides = {}) {
  return prisma.user.create({
    data: {
      name: `Test User`,
      email: `test-user-${Date.now()}${overrides.role ?? ''}@test.com`,
      phone: '11999999999',
      password: '$2a$10$fakeHash',
      role: 'CLIENT',
      ...overrides
    }
  })
}

function login(user) {
  return fastify.jwt.sign({ id: user.id, email: user.email, role: user.role })
}

// ===================== GET /api/users/ =====================

describe('GET /api/users/', () => {
  it('deve retornar 401 sem autenticação', async () => {
    const res = await fastify.inject({ method: 'GET', url: '/api/users' })
    expect(res.statusCode).toBe(401)
  })

  it('deve retornar 403 para não-admin', async () => {
    const client = await createTestUser()
    const token = login(client)
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/users',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(403)
  })

  it('admin deve listar todos os usuários', async () => {
    const admin = await createTestUser({ role: 'ADMIN', email: 'admin1@test.com', name: 'Admin' })
    await createTestUser({ email: 'cliente@test.com', name: 'Cliente' })
    const token = login(admin)
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/users',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(200)
    const users = res.json()
    expect(users.length).toBe(2)
  })

  it('deve filtrar por role', async () => {
    const admin = await createTestUser({ role: 'ADMIN', email: 'a@test.com' })
    await createTestUser({ email: 'c@test.com', name: 'Cliente' })
    const token = login(admin)
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/users?role=ADMIN',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().length).toBe(1)
  })
})

// ===================== GET /api/users/:id =====================

describe('GET /api/users/:id', () => {
  it('cliente pode ver seus próprios dados', async () => {
    const client = await createTestUser()
    const token = login(client)
    const res = await fastify.inject({
      method: 'GET',
      url: `/api/users/${client.id}`,
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe(client.name)
  })

  it('cliente NÃO pode ver dados de outro usuário', async () => {
    const c1 = await createTestUser({ email: 'c1@test.com', name: 'C1' })
    const c2 = await createTestUser({ email: 'c2@test.com', name: 'C2' })
    const token = login(c1)
    const res = await fastify.inject({
      method: 'GET',
      url: `/api/users/${c2.id}`,
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(403)
  })

  it('deve retornar 404 para usuário inexistente', async () => {
    const admin = await createTestUser({ role: 'ADMIN', email: 'admin-404@test.com', name: 'Admin404' })
    const token = login(admin)
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/users/nonexistent',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(404)
  })
})

// ===================== PUT /api/users/:id =====================

describe('PUT /api/users/:id', () => {
  it('cliente pode atualizar seus próprios dados', async () => {
    const client = await createTestUser()
    const token = login(client)
    const res = await fastify.inject({
      method: 'PUT',
      url: `/api/users/${client.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Novo Nome' }
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('Novo Nome')
  })

  it('cliente NÃO pode atualizar dados de outro usuário', async () => {
    const c1 = await createTestUser({ email: 'x1@test.com', name: 'X1' })
    const c2 = await createTestUser({ email: 'x2@test.com', name: 'X2' })
    const token = login(c1)
    const res = await fastify.inject({
      method: 'PUT',
      url: `/api/users/${c2.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Hacked' }
    })
    expect(res.statusCode).toBe(403)
  })

  it('não pode atualizar email para um já existente', async () => {
    const c1 = await createTestUser({ email: 'dup@test.com', name: 'C1' })
    const c2 = await createTestUser({ email: 'dup2@test.com', name: 'C2' })
    const token = login(c1)
    const res = await fastify.inject({
      method: 'PUT',
      url: `/api/users/${c1.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { email: 'dup2@test.com' }
    })
    expect(res.statusCode).toBe(400)
  })
})

// ===================== PATCH /api/users/:id/password =====================

describe('PATCH /api/users/:id/password', () => {
  it('deve retornar 403 para tentar alterar senha de outro', async () => {
    const c1 = await createTestUser({ email: 'pw1@test.com', name: 'P1' })
    const c2 = await createTestUser({ email: 'pw2@test.com', name: 'P2' })
    const token = login(c1)
    const res = await fastify.inject({
      method: 'PATCH',
      url: `/api/users/${c2.id}/password`,
      headers: { authorization: `Bearer ${token}` },
      payload: { currentPassword: 'anything', newPassword: 'newpass123!' }
    })
    expect(res.statusCode).toBe(403)
  })
})

// ===================== DELETE /api/users/:id =====================

describe('DELETE /api/users/:id', () => {
  it('apenas admin pode deletar usuário', async () => {
    const client = await createTestUser()
    const target = await createTestUser({ email: 'del@test.com', name: 'Del' })
    const token = login(client)
    const res = await fastify.inject({
      method: 'DELETE',
      url: `/api/users/${target.id}`,
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(403)
  })

  it('admin pode deletar usuário sem agendamentos', async () => {
    const admin = await createTestUser({ role: 'ADMIN', email: 'admin-del@test.com' })
    const target = await createTestUser({ email: 'del-user@test.com', name: 'DelUser' })
    const token = login(admin)
    const res = await fastify.inject({
      method: 'DELETE',
      url: `/api/users/${target.id}`,
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(204)
  })

  it('não pode deletar usuário com agendamentos', async () => {
    const admin = await createTestUser({ role: 'ADMIN', email: 'admin-no@test.com' })
    const serviceData = await prisma.service.create({
      data: { name: 'S', description: 'd', price: 50, duration: 60, category: 'MANICURE', isActive: true }
    })
    const target = await createTestUser({ email: 'has-booking@test.com', name: 'HasBooking' })
    await prisma.booking.create({
      data: { clientId: target.id, serviceId: serviceData.id, date: '2026-04-06', time: '10:00', status: 'PENDING' }
    })
    const token = login(admin)
    const res = await fastify.inject({
      method: 'DELETE',
      url: `/api/users/${target.id}`,
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(400)
  })
})

// ===================== GET /api/users/stats/overview =====================

describe('GET /api/users/stats/overview', () => {
  it('deve retornar 403 para não-admin', async () => {
    const client = await createTestUser()
    const token = login(client)
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/users/stats/overview',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(403)
  })

  it('deve retornar estatísticas corretas para admin', async () => {
    const admin = await createTestUser({ role: 'ADMIN', email: 'stats-admin@test.com' })
    await createTestUser({ email: 'stats-c1@test.com', name: 'SC1' })
    await createTestUser({ email: 'stats-c2@test.com', name: 'SC2' })
    const token = login(admin)
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/users/stats/overview',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.totalUsers).toBe(3)
    expect(body.totalClients).toBe(2)
    expect(body.totalAdmins).toBe(1)
  })
})
