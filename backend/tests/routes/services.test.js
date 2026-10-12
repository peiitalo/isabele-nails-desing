/**
 * Tests for GET    /api/services/
 *          GET    /api/services/:id
 *          POST   /api/services/
 *          PUT    /api/services/:id
 *          DELETE /api/services/:id
 *          GET    /api/services/stats/overview
 *
 * Note: Fastify resolves static segments before dynamic params, so
 * GET /api/services/stats/overview will not clash with GET /api/services/:id.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { buildApp, cleanup, createTestUser, createTestService, loginToken } from '../helpers/setup.js'
import prisma from '../../src/database/client.js'
import serviceRoutes from '../../src/routes/services.js'

let fastify

beforeAll(async () => {
  await cleanup()
  fastify = await buildApp(serviceRoutes, '/api/services')
})

afterAll(async () => {
  await cleanup()
  await fastify.close()
})

beforeEach(cleanup)

// ===================== GET /api/services/ =====================

describe('GET /api/services/', () => {
  it('deve listar todos os servicos', async () => {
    await prisma.service.createMany({
      data: [
        { name: 'Manicure', description: 'Unhas feitas', price: 50, duration: 60, category: 'MANICURE', isActive: true },
        { name: 'Pedicure', description: 'Pes feitos', price: 40, duration: 45, category: 'PEDICURE', isActive: true }
      ]
    })

    const res = await fastify.inject({ method: 'GET', url: '/api/services' })

    expect(res.statusCode).toBe(200)
    expect(res.json().length).toBe(2)
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

  it('deve filtrar por isActive=false', async () => {
    await prisma.service.createMany({
      data: [
        { name: 'Ativo',   description: 'd', price: 50, duration: 60, category: 'MANICURE', isActive: true  },
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
  it('deve retornar um servico por ID', async () => {
    const service = await createTestService({ name: 'Servico Unico' })

    const res = await fastify.inject({ method: 'GET', url: `/api/services/${service.id}` })

    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('Servico Unico')
  })

  it('deve retornar 404 para servico inexistente', async () => {
    const res = await fastify.inject({ method: 'GET', url: '/api/services/nonexistent-id' })
    expect(res.statusCode).toBe(404)
  })
})

// ===================== POST /api/services/ =====================

describe('POST /api/services/', () => {
  it('deve retornar 401 sem autenticacao', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/services',
      payload: { name: 'Teste', description: 'desc', price: 50, duration: 60, category: 'MANICURE' }
    })

    expect(res.statusCode).toBe(401)
  })

  it('deve retornar 403 para nao-admin', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'POST',
      url: '/api/services',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Teste', description: 'desc', price: 50, duration: 60, category: 'MANICURE' }
    })

    expect(res.statusCode).toBe(403)
  })

  it('admin deve poder criar servico', async () => {
    const admin = await createTestUser({ role: 'ADMIN' })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'POST',
      url: '/api/services',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Manicure Basica', description: 'Servico basico', price: 50, duration: 60, category: 'MANICURE' }
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.name).toBe('Manicure Basica')
    expect(body.isActive).toBe(true)
  })
})

// ===================== PUT /api/services/:id =====================

describe('PUT /api/services/:id', () => {
  it('admin deve poder atualizar servico', async () => {
    const admin = await createTestUser({ role: 'ADMIN' })
    const service = await createTestService({ name: 'Original' })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'PUT',
      url: `/api/services/${service.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Atualizado', price: 75 }
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('Atualizado')
    expect(res.json().price).toBe(75)
  })

  it('deve retornar 403 para nao-admin', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const service = await createTestService({ name: 'Protegido' })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'PUT',
      url: `/api/services/${service.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Atacado' }
    })

    expect(res.statusCode).toBe(403)
  })

  it('deve retornar 404 para servico inexistente', async () => {
    const admin = await createTestUser({ role: 'ADMIN' })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'PUT',
      url: '/api/services/nonexistent-id',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Qualquer' }
    })

    expect(res.statusCode).toBe(404)
  })
})

// ===================== DELETE /api/services/:id =====================

describe('DELETE /api/services/:id', () => {
  it('admin deve poder deletar servico', async () => {
    const admin = await createTestUser({ role: 'ADMIN' })
    const service = await createTestService({ name: 'Para Deletar' })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'DELETE',
      url: `/api/services/${service.id}`,
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(204)
    const exists = await prisma.service.findUnique({ where: { id: service.id } })
    expect(exists).toBe(null)
  })

  it('deve retornar 403 para nao-admin', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const service = await createTestService({ name: 'Intocavel' })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'DELETE',
      url: `/api/services/${service.id}`,
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(403)
  })

  it('deve retornar 404 para servico inexistente', async () => {
    const admin = await createTestUser({ role: 'ADMIN' })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'DELETE',
      url: '/api/services/nonexistent-id',
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(404)
  })
})

// ===================== GET /api/services/stats/overview =====================

describe('GET /api/services/stats/overview', () => {
  it('deve retornar 401 sem autenticacao', async () => {
    const res = await fastify.inject({ method: 'GET', url: '/api/services/stats/overview' })
    expect(res.statusCode).toBe(401)
  })

  it('deve retornar 403 para nao-admin', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'GET',
      url: '/api/services/stats/overview',
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(403)
  })

  it('deve retornar estatisticas corretas para admin', async () => {
    const admin = await createTestUser({ role: 'ADMIN' })
    await prisma.service.createMany({
      data: [
        { name: 'S1', description: 'd', price: 50, duration: 60, category: 'MANICURE', isActive: true  },
        { name: 'S2', description: 'd', price: 40, duration: 45, category: 'PEDICURE', isActive: false }
      ]
    })
    const token = loginToken(fastify, admin)

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
