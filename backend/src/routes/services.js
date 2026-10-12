import * as serviceController from '../controllers/service.controller.js'

export default async function serviceRoutes(fastify, options) {
  // Listar todos os serviços
  fastify.get('/', serviceController.listServices)

  // Obter estatísticas dos serviços (apenas admin)
  fastify.get('/stats/overview', {
    preHandler: [fastify.adminAuth]
  }, serviceController.getStats)

  // Buscar serviço por ID
  fastify.get('/:id', serviceController.getServiceById)

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
  }, serviceController.createService)

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
  }, serviceController.updateService)

  // Deletar serviço (apenas admin)
  fastify.delete('/:id', {
    preHandler: [fastify.adminAuth]
  }, serviceController.deleteService)
}