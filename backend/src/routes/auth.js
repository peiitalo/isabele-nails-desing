import * as authController from '../controllers/auth.controller.js'

export default async function authRoutes(fastify, options) {
  // Login
  fastify.post('/login', authController.login)

  // Registrar novo usuário
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'email', 'phone', 'password'],
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', minLength: 1 },
          password: {
            type: 'string',
            minLength: 8,
            pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-={}:;<>.,?]).{8,}$'
          }
        }
      }
    }
  }, authController.register)

  // Verificar token (rota protegida)
  fastify.get('/me', {
    preHandler: [fastify.authenticate]
  }, authController.getMe)
}