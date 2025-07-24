import prisma from '../database/client.js'

export default async function serviceRoutes(fastify, options) {
  // Listar todos os serviços
  fastify.get('/', async (request, reply) => {
    try {
      const { category, isActive } = request.query
      
      const where = {}
      
      if (category) {
        where.category = category
      }
      
      if (isActive !== undefined) {
        where.isActive = isActive === 'true'
      }

      const services = await prisma.service.findMany({
        where,
        orderBy: { name: 'asc' }
      })

      reply.send(services)
    } catch (error) {
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })

  // Buscar serviço por ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params

      const service = await prisma.service.findUnique({
        where: { id }
      })

      if (!service) {
        return reply.status(404).send({
          error: 'Serviço não encontrado'
        })
      }

      reply.send(service)
    } catch (error) {
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })

  // Criar novo serviço (apenas admin)
  fastify.post('/', {
    preHandler: [fastify.adminAuth],
    schema: {
      body: {
        type: 'object',
        required: ['name', 'description', 'price', 'duration', 'category'],
        properties: {
          name: { type: 'string', minLength: 1 },
          description: { type: 'string', minLength: 1 },
          price: { type: 'number', minimum: 0 },
          duration: { type: 'integer', minimum: 1 },
          category: { 
            type: 'string', 
            enum: ['MANICURE', 'PEDICURE', 'ESMALTACAO', 'DECORACAO'] 
          },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const serviceData = request.body

      const service = await prisma.service.create({
        data: serviceData
      })

      reply.status(201).send(service)
    } catch (error) {
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })

  // Atualizar serviço (apenas admin)
  fastify.put('/:id', {
    preHandler: [fastify.adminAuth],
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          description: { type: 'string', minLength: 1 },
          price: { type: 'number', minimum: 0 },
          duration: { type: 'integer', minimum: 1 },
          category: { 
            type: 'string', 
            enum: ['MANICURE', 'PEDICURE', 'ESMALTACAO', 'DECORACAO'] 
          },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params
      const updateData = request.body

      const service = await prisma.service.update({
        where: { id },
        data: updateData
      })

      reply.send(service)
    } catch (error) {
      if (error.code === 'P2025') {
        return reply.status(404).send({
          error: 'Serviço não encontrado'
        })
      }
      
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })

  // Deletar serviço (apenas admin)
  fastify.delete('/:id', {
    preHandler: [fastify.adminAuth]
  }, async (request, reply) => {
    try {
      const { id } = request.params

      // Permite deletar serviço mesmo que possua agendamentos

      await prisma.service.delete({
        where: { id }
      })

      reply.status(204).send()
    } catch (error) {
      if (error.code === 'P2025') {
        return reply.status(404).send({
          error: 'Serviço não encontrado'
        })
      }
      
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })

  // Obter estatísticas dos serviços (apenas admin)
  fastify.get('/stats/overview', {
    preHandler: [fastify.adminAuth]
  }, async (request, reply) => {
    try {
      const totalServices = await prisma.service.count()
      const activeServices = await prisma.service.count({
        where: { isActive: true }
      })

      const servicesByCategory = await prisma.service.groupBy({
        by: ['category'],
        _count: {
          category: true
        }
      })

      const totalRevenue = await prisma.booking.aggregate({
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

      reply.send({
        totalServices,
        activeServices,
        servicesByCategory,
        totalRevenue: totalRevenue._sum.service?.price || 0
      })
    } catch (error) {
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })
} 