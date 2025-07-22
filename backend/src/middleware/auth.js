import jwt from '@fastify/jwt'

export async function authMiddleware(request, reply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
}

export async function adminMiddleware(request, reply) {
  try {
    await request.jwtVerify()
    
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({
        error: 'Acesso negado. Apenas administradores podem acessar este recurso.'
      })
    }
  } catch (err) {
    reply.send(err)
  }
} 