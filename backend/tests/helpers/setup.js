/**
 * Shared test helpers for route tests.
 *
 * Exports:
 *  - buildApp(routePlugin, prefix)  - configured Fastify instance
 *  - cleanup()                       - wipes all DB tables in dependency order
 *  - createTestUser(overrides)       - helper to seed a User row
 *  - createTestService(overrides)    - helper to seed a Service row
 *  - loginToken(fastify, user)       - returns a signed JWT string
 */

import Fastify from 'fastify'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import prisma from '../../src/database/client.js'

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

/**
 * Delete all rows in the correct order (children before parents).
 */
export async function cleanup() {
  await prisma.booking.deleteMany()
  await prisma.specialDay.deleteMany()
  await prisma.workingHour.deleteMany()
  await prisma.service.deleteMany()
  await prisma.user.deleteMany()
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

/**
 * Create a User in the database.
 * @param {object} overrides - fields to override on the default user
 */
export async function createTestUser(overrides = {}) {
  const role = overrides.role ?? 'CLIENT'
  return prisma.user.create({
    data: {
      name: `Test ${role}`,
      email: `test-${role}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
      phone: '11999999999',
      password: '$2a$10$fakeHashedPasswordValue',
      role,
      ...overrides
    }
  })
}

/**
 * Create a Service in the database.
 * @param {object} overrides - fields to override on the default service
 */
export async function createTestService(overrides = {}) {
  return prisma.service.create({
    data: {
      name: 'Servico Teste',
      description: 'Descricao do servico de teste',
      price: 50,
      duration: 60,
      category: 'MANICURE',
      isActive: true,
      ...overrides
    }
  })
}

// ---------------------------------------------------------------------------
// App builder
// ---------------------------------------------------------------------------

/**
 * Build and return a ready Fastify instance configured identically to
 * server.js but without starting an HTTP server:
 *  - @fastify/cookie
 *  - @fastify/jwt   (same secret as production default)
 *  - `authenticate` decorator  - verifies JWT from header or cookie
 *  - `adminAuth`    decorator  - same as authenticate + role === 'ADMIN' check
 *  - the supplied routePlugin registered under `prefix`
 *
 * @param {Function} routePlugin  - the default-exported Fastify plugin function
 * @param {string}   prefix       - URL prefix (e.g. '/api/auth')
 * @returns {Promise<import('fastify').FastifyInstance>}
 */
export async function buildApp(routePlugin, prefix) {
  const fastify = Fastify({ logger: false })

  await fastify.register(cookie)
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'isa-nails-secret-key-change-in-production'
  })

  // Mirrors src/middleware/auth.js - authMiddleware
  async function authMiddleware(request, reply) {
    if (!request.headers.authorization && request.cookies && request.cookies.token) {
      request.headers.authorization = `Bearer ${request.cookies.token}`
    }
    await request.jwtVerify()
  }

  // Mirrors src/middleware/auth.js - adminMiddleware
  async function adminMiddleware(request, reply) {
    if (!request.headers.authorization && request.cookies && request.cookies.token) {
      request.headers.authorization = `Bearer ${request.cookies.token}`
    }
    await request.jwtVerify()
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({
        error: 'Acesso negado. Apenas administradores podem acessar este recurso.'
      })
    }
  }

  fastify.decorate('authenticate', authMiddleware)
  fastify.decorate('adminAuth', adminMiddleware)

  await fastify.register(routePlugin, { prefix })
  await fastify.ready()

  return fastify
}

/**
 * Sign a JWT for the given user using the Fastify instance's JWT plugin.
 * @param {import('fastify').FastifyInstance} fastify
 * @param {{ id: string, email: string, role: string }} user
 * @returns {string}
 */
export function loginToken(fastify, user) {
  return fastify.jwt.sign({ id: user.id, email: user.email, role: user.role })
}
