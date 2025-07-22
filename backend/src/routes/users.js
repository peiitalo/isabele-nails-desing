import prisma from '../database/client.js'
import bcrypt from 'bcryptjs'

export default async function userRoutes(fastify, options) {
  // Listar usuários (apenas admin)
  fastify.get('/', {
    preHandler: [fastify.adminAuth]
  }, async (request, reply) => {
    try {
      const { role, search } = request.query
      
      const where = {}
      
      if (role) {
        where.role = role
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } }
        ]
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              bookings: true
            }
          }
        },
        orderBy: { name: 'asc' }
      })

      reply.send(users)
    } catch (error) {
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })

  // Buscar usuário por ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { id } = request.params
      const user = request.user

      // Verificar permissão
      if (user.role === 'CLIENT' && user.id !== id) {
        return reply.status(403).send({
          error: 'Acesso negado'
        })
      }

      const userData = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          bookings: {
            select: {
              id: true,
              date: true,
              time: true,
              status: true,
              service: {
                select: {
                  name: true,
                  price: true
                }
              }
            },
            orderBy: [
              { date: 'desc' },
              { time: 'desc' }
            ]
          }
        }
      })

      if (!userData) {
        return reply.status(404).send({
          error: 'Usuário não encontrado'
        })
      }

      reply.send(userData)
    } catch (error) {
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })

  // Atualizar perfil do usuário
  fastify.put('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params
      const updateData = request.body
      const user = request.user

      // Verificar permissão
      if (user.role === 'CLIENT' && user.id !== id) {
        return reply.status(403).send({
          error: 'Acesso negado'
        })
      }

      // Se estiver atualizando email, verificar se já existe
      if (updateData.email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: updateData.email,
            id: { not: id }
          }
        })

        if (existingUser) {
          return reply.status(400).send({
            error: 'Email já está em uso'
          })
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true
        }
      })

      reply.send(updatedUser)
    } catch (error) {
      if (error.code === 'P2025') {
        return reply.status(404).send({
          error: 'Usuário não encontrado'
        })
      }
      
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })

  // Alterar senha
  fastify.patch('/:id/password', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', minLength: 1 },
          newPassword: { type: 'string', minLength: 6 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params
      const { currentPassword, newPassword } = request.body
      const user = request.user

      // Verificar permissão
      if (user.role === 'CLIENT' && user.id !== id) {
        return reply.status(403).send({
          error: 'Acesso negado'
        })
      }

      // Buscar usuário com senha
      const userData = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          password: true
        }
      })

      if (!userData) {
        return reply.status(404).send({
          error: 'Usuário não encontrado'
        })
      }

      // Verificar senha atual
      const isValidPassword = await bcrypt.compare(currentPassword, userData.password)
      if (!isValidPassword) {
        return reply.status(400).send({
          error: 'Senha atual incorreta'
        })
      }

      // Criptografar nova senha
      const hashedNewPassword = await bcrypt.hash(newPassword, 10)

      // Atualizar senha
      await prisma.user.update({
        where: { id },
        data: { password: hashedNewPassword }
      })

      reply.send({ message: 'Senha alterada com sucesso' })
    } catch (error) {
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })

  // Deletar usuário (apenas admin)
  fastify.delete('/:id', {
    preHandler: [fastify.adminAuth]
  }, async (request, reply) => {
    try {
      const { id } = request.params

      // Verificar se há agendamentos para este usuário
      const bookings = await prisma.booking.findMany({
        where: { clientId: id }
      })

      if (bookings.length > 0) {
        return reply.status(400).send({
          error: 'Não é possível deletar um usuário que possui agendamentos'
        })
      }

      await prisma.user.delete({
        where: { id }
      })

      reply.status(204).send()
    } catch (error) {
      if (error.code === 'P2025') {
        return reply.status(404).send({
          error: 'Usuário não encontrado'
        })
      }
      
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })

  // Estatísticas dos usuários (apenas admin)
  fastify.get('/stats/overview', {
    preHandler: [fastify.adminAuth]
  }, async (request, reply) => {
    try {
      const [
        totalUsers,
        totalClients,
        totalAdmins,
        activeClients,
        totalRevenue
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'CLIENT' } }),
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.user.count({
          where: {
            role: 'CLIENT',
            bookings: {
              some: {
                date: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                }
              }
            }
          }
        }),
        prisma.booking.aggregate({
          _sum: {
            service: {
              select: {
                price: true
              }
            }
          },
          where: {
            status: 'COMPLETED'
          }
        })
      ])

      reply.send({
        totalUsers,
        totalClients,
        totalAdmins,
        activeClients,
        totalRevenue: totalRevenue._sum.service?.price || 0
      })
    } catch (error) {
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })
} 