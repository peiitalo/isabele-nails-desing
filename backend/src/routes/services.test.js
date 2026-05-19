import Fastify from 'fastify'
import jwt from '@fastify/jwt'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import prisma from '../database/client.js'
import serviceRoutes from './services.js'

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

  await fastify.register(serviceRoutes, { prefix: '/api/services' })
  await fastify.ready()
})

afterAll(async () => {
  await fastify.close()
})

async function cleanup() {
  await prisma.booking.deleteMany()
  await prisma.service.deleteMany()
  await prisma.user.deleteMany()
}

beforeEach(cleanup)
afterAll(cleanup)

async function createTestUser(role = 'CLIENT') {
  return prisma.user.create({
    data: {
      name: `Test ${role}`,
      email: `test-svc-${role}-${Date.now()}@test.com`,
      phone: '11999999999',
      password: 'hashed',
      role
    }
  })
}

function login(user) {
  return fastify.jwt.sign({ id: user.id, email: user.email, role: user.role })
}

// ===================== GET /api/services/ =====================

describe('GET /api/services/', () => {
  it('deve listar todos os serviços', async () => {
    await prisma.service.createMany({
      data: [
        { name: 'Manicure', description: 'Unhas feitas', price: 50, duration: 60, category: 'MANICURE', isActive: true },
        { name: 'Pedicure', description: 'Pés feitos', price: 40, duration: 45, category: 'PEDICURE', isActive: true }
      ]
    })
    const res = await fastify.inject({ method: 'GET', url: '/api/services' })
    expect(res.statusCode).toBe(200)
    const services = res.json()
    expect(services.length).toBe(2)
  })

  it('deve filtrar por categoria', async () => {
    await prisma.service.createMany({
      data: [
        { name: 'Manicure', description: 'd', price: 50, duration: 60, category: 'MANICURE', isActive: true },
        { name: 'Pedicure', description: 'd', price: 40, duration: 45, category: 'PEDICURE', isActive: true }
      ]
    })
    const res = await fastify.inject({ method: 'GET', url: '/api/services?category=MANICURE' })
    expect(res.statusCode).toBe(200)
    expect(res.json().length).toBe(1)
    expect(res.json()[0].category).toBe('MANICURE')
  })

  it('deve filtrar por isActive', async () => {
    await prisma.service.createMany({
      data: [
        { name: 'Ativo', description: 'd', price: 50, duration: 60, category: 'MANICURE', isActive: true },
        { name: 'Inativo', description: 'd', price: 40, duration: 45, category: 'PEDICURE', isActive: false }
      ]
    })
    const res = await fastify.inject({ method: 'GET', url: '/api/services?isActive=false' })
    expect(res.statusCode).toBe(200)
    expect(res.json().length).toBe(1)
    expect(res.json()[0].isActive).toBe(false)
  })
})

// ===================== GET /api/services/:id =====================

describe('GET /api/services/:id', () => {
  it('deve retornar um serviço por ID', async () => {
    const service = await prisma.service.create({
      data: { name: 'Teste', description: 'desc', price: 50, duration: 60, category: 'MANICURE', isActive: true }
    })
    const res = await fastify.inject({ method: 'GET', url: `/api/services/${service.id}` })
    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('Teste')
  })

  it('deve retornar 404 para serviço inexistente', async () => {
    const res = await fastify.inject({ method: 'GET', url: '/api/services/nonexistent' })
    expect(res.statusCode).toBe(404)
  })
})

// ===================== POST /api/services/ =====================

describe('POST /api/services/', () => {
  it('deve retornar 401 sem autenticação', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/services',
      payload: { name: 'Teste', description: 'desc', price: 50, duration: 60, category: 'MANICURE' }
    })
    expect(res.statusCode).toBe(401)
  })

  it('deve retornar 403 para não-admin', async () => {
    const client = await createTestUser('CLIENT')
    const token = login(client)
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/services',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Teste', description: 'desc', price: 50, duration: 60, category: 'MANICURE' }
    })
    expect(res.statusCode).toBe(403)
  })

  it('admin deve poder criar serviço', async () => {
    const admin = await createTestUser('ADMIN')
    const token = login(admin)
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/services',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Manicure Básica', description: 'Serviço básico', price: 50, duration: 60, category: 'MANICURE' }
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.name).toBe('Manicure Básica')
    expect(body.isActive).toBe(true)
  })
})

// ===================== PUT /api/services/:id =====================

describe('PUT /api/services/:id', () => {
  it('admin deve poder atualizar serviço', async () => {
    const admin = await createTestUser('ADMIN')
    const service = await prisma.service.create({
      data: { name: 'Original', description: 'desc', price: 50, duration: 60, category: 'MANICURE', isActive: true }
    })
    const token = login(admin)
    const res = await fastify.inject({
      method: 'PUT',
      url: `/api/services/${service.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Atualizado', price: 75 }
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.name).toBe('Atualizado')
    expect(body.price).toBe(75)
  })

  it('deve retornar 403 para não-admin', async () => {
    const client = await createTestUser('CLIENT')
    const service = await prisma.service.create({
      data: { name: 'Original', description: 'desc', price: 50, duration: 60, category: 'MANICURE', isActive: true }
    })
    const token = login(client)
    const res = await fastify.inject({
      method: 'PUT',
      url: `/api/services/${service.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Atacado' }
    })
    expect(res.statusCode).toBe(403)
  })
})

// ===================== DELETE /api/services/:id =====================

describe('DELETE /api/services/:id', () => {
  it('admin deve poder deletar serviço', async () => {
    const admin = await createTestUser('ADMIN')
    const service = await prisma.service.create({
      data: { name: 'Para Deletar', description: 'desc', price: 50, duration: 60, category: 'MANICURE', isActive: true }
    })
    const token = login(admin)
    const res = await fastify.inject({
      method: 'DELETE',
      url: `/api/services/${service.id}`,
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(204)
    const exists = await prisma.service.findUnique({ where: { id: service.id } })
    expect(exists).toBe(null)
  })

  it('deve retornar 403 para não-admin', async () => {
    const client = await createTestUser('CLIENT')
    const service = await prisma.service.create({
      data: { name: 'Protegido', description: 'desc', price: 50, duration: 60, category: 'MANICURE', isActive: true }
    })
    const token = login(client)
    const res = await fastify.inject({
      method: 'DELETE',
      url: `/api/services/${service.id}`,
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(403)
  })
})

// ===================== GET /api/services/stats/overview =====================

describe('GET /api/services/stats/overview', () => {
  it('deve retornar 403 para não-admin', async () => {
    const client = await createTestUser()
    const token = login(client)
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/services/stats/overview',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(403)
  })

  it('deve retornar estatísticas corretas', async () => {
    const admin = await createTestUser('ADMIN')
    await prisma.service.createMany({
      data: [
        { name: 'S1', description: 'd', price: 50, duration: 60, category: 'MANICURE', isActive: true },
        { name: 'S2', description: 'd', price: 40, duration: 45, category: 'PEDICURE', isActive: false }
      ]
    })
    const token = login(admin)
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/services/stats/overview',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.totalServices).toBe(2)
    expect(body.activeServices).toBe(1)
    expect(body.servicesByCategory.length).toBe(2)
  })
})
