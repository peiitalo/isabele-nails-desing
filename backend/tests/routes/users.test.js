/**
 * Tests for GET    /api/users/
 *          GET    /api/users/:id
 *          PUT    /api/users/:id
 *          PATCH  /api/users/:id/password
 *          DELETE /api/users/:id
 *          GET    /api/users/stats/overview
 *
 * Access rules:
 *  - GET  /            admin only
 *  - GET  /:id         own data (CLIENT) or any (ADMIN)
 *  - PUT  /:id         own data (CLIENT) or any (ADMIN)
 *  - PATCH/:id/password own data (CLIENT) or any (ADMIN)
 *  - DELETE/:id        admin only; blocked if user has bookings
 *  - GET  /stats/overview admin only
 */

import bcrypt from 'bcryptjs'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { buildApp, cleanup, createTestUser, createTestService, loginToken } from '../helpers/setup.js'
import prisma from '../../src/database/client.js'
import userRoutes from '../../src/routes/users.js'

let fastify

beforeAll(async () => {
  await cleanup()
  fastify = await buildApp(userRoutes, '/api/users')
})

afterAll(async () => {
  await cleanup()
  await fastify.close()
})

beforeEach(cleanup)

// ===================== GET /api/users/ =====================

describe('GET /api/users/', () => {
  it('deve retornar 401 sem autenticacao', async () => {
    const res = await fastify.inject({ method: 'GET', url: '/api/users' })
    expect(res.statusCode).toBe(401)
  })

  it('deve retornar 403 para nao-admin', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'GET',
      url: '/api/users',
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(403)
  })

  it('admin deve listar todos os usuarios', async () => {
    const admin = await createTestUser({ role: 'ADMIN', email: 'admin1@test.com', name: 'Admin' })
    await createTestUser({ email: 'cliente@test.com', name: 'Cliente' })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'GET',
      url: '/api/users',
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().length).toBe(2)
  })

  it('deve filtrar por role', async () => {
    const admin = await createTestUser({ role: 'ADMIN', email: 'a@test.com' })
    await createTestUser({ email: 'c@test.com', name: 'Cliente' })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'GET',
      url: '/api/users?role=ADMIN',
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().length).toBe(1)
    expect(res.json()[0].role).toBe('ADMIN')
  })
})

// ===================== GET /api/users/:id =====================

describe('GET /api/users/:id', () => {
  it('cliente pode ver seus proprios dados', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'GET',
      url: `/api/users/${client.id}`,
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe(client.name)
  })

  it('cliente NAO pode ver dados de outro usuario', async () => {
    const c1 = await createTestUser({ email: 'c1@test.com', name: 'C1' })
    const c2 = await createTestUser({ email: 'c2@test.com', name: 'C2' })
    const token = loginToken(fastify, c1)

    const res = await fastify.inject({
      method: 'GET',
      url: `/api/users/${c2.id}`,
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(403)
  })

  it('admin pode ver dados de qualquer usuario', async () => {
    const admin = await createTestUser({ role: 'ADMIN', email: 'admin-get@test.com' })
    const client = await createTestUser({ email: 'target-get@test.com', name: 'Target' })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'GET',
      url: `/api/users/${client.id}`,
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('Target')
  })

  it('deve retornar 404 para usuario inexistente', async () => {
    const admin = await createTestUser({ role: 'ADMIN', email: 'admin-404@test.com', name: 'Admin404' })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'GET',
      url: '/api/users/nonexistent-id',
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(404)
  })
})

// ===================== PUT /api/users/:id =====================

describe('PUT /api/users/:id', () => {
  it('cliente pode atualizar seus proprios dados', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'PUT',
      url: `/api/users/${client.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Novo Nome' }
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('Novo Nome')
  })

  it('cliente NAO pode atualizar dados de outro usuario', async () => {
    const c1 = await createTestUser({ email: 'x1@test.com', name: 'X1' })
    const c2 = await createTestUser({ email: 'x2@test.com', name: 'X2' })
    const token = loginToken(fastify, c1)

    const res = await fastify.inject({
      method: 'PUT',
      url: `/api/users/${c2.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Hacked' }
    })

    expect(res.statusCode).toBe(403)
  })

  it('nao pode atualizar email para um ja existente', async () => {
    const c1 = await createTestUser({ email: 'dup@test.com', name: 'C1' })
    await createTestUser({ email: 'dup2@test.com', name: 'C2' })
    const token = loginToken(fastify, c1)

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
  it('deve retornar 403 ao tentar alterar senha de outro usuario', async () => {
    const c1 = await createTestUser({ email: 'pw1@test.com', name: 'P1' })
    const c2 = await createTestUser({ email: 'pw2@test.com', name: 'P2' })
    const token = loginToken(fastify, c1)

    const res = await fastify.inject({
      method: 'PATCH',
      url: `/api/users/${c2.id}/password`,
      headers: { authorization: `Bearer ${token}` },
      payload: { currentPassword: 'anything', newPassword: 'newpass123!' }
    })

    expect(res.statusCode).toBe(403)
  })

  it('deve alterar a propria senha com credenciais corretas', async () => {
    const plainPassword = 'OldPass1!'
    const hashedPassword = await bcrypt.hash(plainPassword, 10)
    const client = await prisma.user.create({
      data: {
        name: 'PW Change',
        email: 'pwchange@test.com',
        phone: '11999999999',
        password: hashedPassword,
        role: 'CLIENT'
      }
    })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'PATCH',
      url: `/api/users/${client.id}/password`,
      headers: { authorization: `Bearer ${token}` },
      payload: { currentPassword: plainPassword, newPassword: 'NewPass2!' }
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().message).toBe('Senha alterada com sucesso')
  })

  it('deve retornar 400 para senha atual incorreta', async () => {
    const hashedPassword = await bcrypt.hash('CorrectPass1!', 10)
    const client = await prisma.user.create({
      data: {
        name: 'PW Wrong',
        email: 'pwwrong@test.com',
        phone: '11999999999',
        password: hashedPassword,
        role: 'CLIENT'
      }
    })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'PATCH',
      url: `/api/users/${client.id}/password`,
      headers: { authorization: `Bearer ${token}` },
      payload: { currentPassword: 'WrongPass!', newPassword: 'NewPass2!' }
    })

    expect(res.statusCode).toBe(400)
  })
})

// ===================== DELETE /api/users/:id =====================

describe('DELETE /api/users/:id', () => {
  it('apenas admin pode deletar usuario', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const target = await createTestUser({ email: 'del@test.com', name: 'Del' })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'DELETE',
      url: `/api/users/${target.id}`,
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(403)
  })

  it('admin pode deletar usuario sem agendamentos', async () => {
    const admin = await createTestUser({ role: 'ADMIN', email: 'admin-del@test.com' })
    const target = await createTestUser({ email: 'del-user@test.com', name: 'DelUser' })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'DELETE',
      url: `/api/users/${target.id}`,
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(204)
    const exists = await prisma.user.findUnique({ where: { id: target.id } })
    expect(exists).toBe(null)
  })

  it('nao pode deletar usuario com agendamentos', async () => {
    const admin = await createTestUser({ role: 'ADMIN', email: 'admin-no@test.com' })
    const target = await createTestUser({ email: 'has-booking@test.com', name: 'HasBooking' })
    const service = await createTestService()

    await prisma.booking.create({
      data: {
        clientId: target.id,
        serviceId: service.id,
        date: '2026-04-06',
        time: '10:00',
        status: 'PENDING'
      }
    })

    const token = loginToken(fastify, admin)
    const res = await fastify.inject({
      method: 'DELETE',
      url: `/api/users/${target.id}`,
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(400)
  })

  it('deve retornar 404 para usuario inexistente', async () => {
    const admin = await createTestUser({ role: 'ADMIN', email: 'admin-nx@test.com' })
    const token = loginToken(fastify, admin)

    const res = await fastify.inject({
      method: 'DELETE',
      url: '/api/users/nonexistent-id',
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(404)
  })
})

// ===================== GET /api/users/stats/overview =====================

describe('GET /api/users/stats/overview', () => {
  it('deve retornar 401 sem autenticacao', async () => {
    const res = await fastify.inject({ method: 'GET', url: '/api/users/stats/overview' })
    expect(res.statusCode).toBe(401)
  })

  it('deve retornar 403 para nao-admin', async () => {
    const client = await createTestUser({ role: 'CLIENT' })
    const token = loginToken(fastify, client)

    const res = await fastify.inject({
      method: 'GET',
      url: '/api/users/stats/overview',
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(403)
  })

  it('deve retornar estatisticas corretas para admin', async () => {
    const admin = await createTestUser({ role: 'ADMIN', email: 'stats-admin@test.com' })
    await createTestUser({ email: 'stats-c1@test.com', name: 'SC1' })
    await createTestUser({ email: 'stats-c2@test.com', name: 'SC2' })
    const token = loginToken(fastify, admin)

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
    expect(typeof body.totalRevenue).toBe('number')
    expect(typeof body.activeClients).toBe('number')
  })
})
