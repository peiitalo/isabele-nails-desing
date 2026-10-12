/**
 * Tests for POST /api/auth/login
 *          POST /api/auth/register
 *          GET  /api/auth/me
 */

import bcrypt from 'bcryptjs'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { buildApp, cleanup, loginToken } from '../helpers/setup.js'
import prisma from '../../src/database/client.js'
import authRoutes from '../../src/routes/auth.js'

let fastify

beforeAll(async () => {
  await cleanup()
  fastify = await buildApp(authRoutes, '/api/auth')
})

afterAll(async () => {
  await cleanup()
  await fastify.close()
})

beforeEach(cleanup)

// ===================== POST /api/auth/login =====================

describe('POST /api/auth/login', () => {
  it('deve logar com credenciais corretas', async () => {
    const hashedPassword = await bcrypt.hash('Str0ng!Pass', 10)
    await prisma.user.create({
      data: {
        name: 'Login Test',
        email: 'login@test.com',
        phone: '11999999999',
        password: hashedPassword,
        role: 'CLIENT'
      }
    })

    const res = await fastify.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'login@test.com', password: 'Str0ng!Pass' }
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.user.email).toBe('login@test.com')
    expect(body.user.name).toBe('Login Test')
    expect(body.user.password).toBeUndefined()
  })

  it('deve retornar 401 com senha incorreta', async () => {
    const hashedPassword = await bcrypt.hash('RealPass1!', 10)
    await prisma.user.create({
      data: {
        name: 'Wrong Pass',
        email: 'wrong@test.com',
        phone: '11999999999',
        password: hashedPassword,
        role: 'CLIENT'
      }
    })

    const res = await fastify.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'wrong@test.com', password: 'WrongPass!' }
    })

    expect(res.statusCode).toBe(401)
  })

  it('deve retornar 401 com email inexistente', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'noexist@test.com', password: 'AnyPass!' }
    })

    expect(res.statusCode).toBe(401)
  })

  it('deve definir cookie HTTPOnly de autenticacao apos login', async () => {
    const hashedPassword = await bcrypt.hash('CookiePass1!', 10)
    await prisma.user.create({
      data: {
        name: 'Cookie Test',
        email: 'cookie@test.com',
        phone: '11999999999',
        password: hashedPassword,
        role: 'CLIENT'
      }
    })

    const res = await fastify.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'cookie@test.com', password: 'CookiePass1!' }
    })

    expect(res.statusCode).toBe(200)
    const tokenCookie = res.cookies.find(c => c.name === 'token')
    expect(tokenCookie).toBeDefined()
    expect(tokenCookie.httpOnly).toBe(true)
  })
})

// ===================== POST /api/auth/register =====================

describe('POST /api/auth/register', () => {
  it('deve registrar novo usuario com sucesso', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'New User',
        email: 'newuser@test.com',
        phone: '11988888888',
        password: 'Str0ng!Pass'
      }
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.user.email).toBe('newuser@test.com')
    expect(body.user.role).toBe('CLIENT')
    expect(body.user.password).toBeUndefined()
  })

  it('novo usuario deve ser CLIENT por padrao', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Role Test',
        email: 'role@test.com',
        phone: '11977777777',
        password: 'Str0ng!Pass'
      }
    })

    expect(res.json().user.role).toBe('CLIENT')
  })

  it('deve retornar 400 para email duplicado', async () => {
    await prisma.user.create({
      data: {
        name: 'Dup User',
        email: 'dup@test.com',
        phone: '11966666666',
        password: await bcrypt.hash('pass', 10),
        role: 'CLIENT'
      }
    })

    const res = await fastify.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { name: 'Dup 2', email: 'dup@test.com', phone: '11955555555', password: 'Str0ng!Pass' }
    })

    expect(res.statusCode).toBe(400)
  })

  it('deve retornar 400 para senha fraca (sem caractere especial)', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { name: 'Weak Pass', email: 'weak@test.com', phone: '11944444444', password: 'Weakpass1A' }
    })

    expect(res.statusCode).toBe(400)
  })

  it('deve retornar 400 para senha muito curta (7 caracteres)', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { name: 'Short', email: 'short@test.com', phone: '11933333333', password: 'Ab1!Xyz' }
    })

    expect(res.statusCode).toBe(400)
  })

  it('deve retornar 400 para senha sem digitos', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { name: 'No Digit', email: 'nodigit@test.com', phone: '11900000000', password: 'Strong!PassA' }
    })

    expect(res.statusCode).toBe(400)
  })

  it('deve definir token no cookie apos registro', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { name: 'Cookie Reg', email: 'cookiereg@test.com', phone: '11922222222', password: 'Str0ng!Pass' }
    })

    expect(res.statusCode).toBe(201)
    const tokenCookie = res.cookies.find(c => c.name === 'token')
    expect(tokenCookie).toBeDefined()
  })
})

// ===================== GET /api/auth/me =====================

describe('GET /api/auth/me', () => {
  it('deve retornar 401 sem token', async () => {
    const res = await fastify.inject({ method: 'GET', url: '/api/auth/me' })
    expect(res.statusCode).toBe(401)
  })

  it('deve retornar dados do usuario logado', async () => {
    const hashedPassword = await bcrypt.hash('MePass1!', 10)
    const user = await prisma.user.create({
      data: {
        name: 'Me Test',
        email: 'me@test.com',
        phone: '11911111111',
        password: hashedPassword,
        role: 'CLIENT'
      }
    })

    const token = loginToken(fastify, user)
    const res = await fastify.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` }
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.user.id).toBe(user.id)
    expect(body.user.name).toBe('Me Test')
    expect(body.user).not.toHaveProperty('password')
  })
})
