import bcrypt from 'bcryptjs'
import prisma from '../database/client.js'

export default async function authRoutes(fastify, options) {
  // Login
  fastify.post('/login', async (request, reply) => {
    console.log('🔍 Login request recebido')
    console.log('📥 Headers:', request.headers)
    console.log('📥 Body:', request.body)
    console.log('📥 Body type:', typeof request.body)
    
    try {
      const { email, password } = request.body

      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        return reply.status(401).send({
          error: 'Email ou senha incorretos'
        })
      }

      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return reply.status(401).send({
          error: 'Email ou senha incorretos'
        })
      }

      // Gerar token JWT
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role
      })

      // Retornar dados do usuário (sem senha) e token
      const { password: _, ...userWithoutPassword } = user
      
      reply.send({
        user: userWithoutPassword,
        token
      })
    } catch (error) {
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })

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
          password: { type: 'string', minLength: 6 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { name, email, phone, password } = request.body

      // Verificar se email já existe
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return reply.status(400).send({
          error: 'Email já cadastrado'
        })
      }

      // Criptografar senha
      const hashedPassword = await bcrypt.hash(password, 10)

      // Criar usuário
      const user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          role: 'CLIENT' // Por padrão, novos usuários são clientes
        }
      })

      // Gerar token JWT
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role
      })

      // Retornar dados do usuário (sem senha) e token
      const { password: _, ...userWithoutPassword } = user
      
      reply.status(201).send({
        user: userWithoutPassword,
        token
      })
    } catch (error) {
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })

  // Verificar token (rota protegida)
  fastify.get('/me', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true
        }
      })

      if (!user) {
        return reply.status(404).send({
          error: 'Usuário não encontrado'
        })
      }

      reply.send({ user })
    } catch (error) {
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })
} 