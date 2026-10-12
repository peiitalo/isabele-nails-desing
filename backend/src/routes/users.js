import * as userController from '../controllers/user.controller.js'

export default async function userRoutes(fastify, options) {
  // Listar usuários (apenas admin)
  fastify.get('/', {
    preHandler: [fastify.adminAuth]
  }, userController.listUsers)

  // Estatísticas dos usuários (apenas admin)
  fastify.get('/stats/overview', {
    preHandler: [fastify.adminAuth]
  }, userController.getStats)

  // Buscar usuário por ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate]
  }, userController.getUserById)

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
  }, userController.updateUser)

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
  }, userController.changePassword)

  // Deletar usuário (apenas admin)
  fastify.delete('/:id', {
    preHandler: [fastify.adminAuth]
  }, userController.deleteUser)
}