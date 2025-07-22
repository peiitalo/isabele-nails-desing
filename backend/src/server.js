import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { authMiddleware, adminMiddleware } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import serviceRoutes from './routes/services.js'
import bookingRoutes from './routes/bookings.js'
import userRoutes from './routes/users.js'

const fastify = Fastify({
  logger: true,
  bodyLimit: 1048576
})

// Registrar plugins
await fastify.register(cors, {
  origin: [
    'http://localhost:3000', 
  ],
  credentials: true
})

// Configurar para processar JSON
fastify.addContentTypeParser(/^application\/json(;.*)?$/, { parseAs: 'string' }, function (req, body, done) {
  try {
    const json = JSON.parse(body)
    done(null, json)
  } catch (err) {
    err.statusCode = 400
    done(err, undefined)
  }
})

fastify.addContentTypeParser('text/plain', { parseAs: 'string' }, function (req, body, done) {
  try {
    const json = JSON.parse(body)
    done(null, json)
  } catch (err) {
    err.statusCode = 400
    done(err, undefined)
  }
})

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'isa-nails-secret-key-change-in-production'
})

// Registrar middlewares personalizados
fastify.decorate('authenticate', authMiddleware)
fastify.decorate('adminAuth', adminMiddleware)

// Registrar rotas
await fastify.register(authRoutes, { prefix: '/api/auth' })
await fastify.register(serviceRoutes, { prefix: '/api/services' })
await fastify.register(bookingRoutes, { prefix: '/api/bookings' })
await fastify.register(userRoutes, { prefix: '/api/users' })

// Rota de health check
fastify.get('/health', async (request, reply) => {
  return { status: 'OK', timestamp: new Date().toISOString() }
})

// Rota raiz
fastify.get('/', async (request, reply) => {
  return {
    message: 'Isa Nails Design API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      services: '/api/services',
      bookings: '/api/bookings',
      users: '/api/users'
    }
  }
})

// Tratamento de erros global
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error)
  
  if (error.validation) {
    return reply.status(400).send({
      error: 'Dados inválidos',
      details: error.validation
    })
  }
  
  reply.status(500).send({
    error: 'Erro interno do servidor'
  })
})

// Iniciar servidor
try {
  const port = process.env.PORT || 3333
  const host = process.env.HOST || '0.0.0.0'
  
  await fastify.listen({ port, host })
  console.log(`🚀 Servidor rodando em http://localhost:${port}`)
  console.log(`📚 Documentação da API: http://localhost:${port}/docs`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
} 