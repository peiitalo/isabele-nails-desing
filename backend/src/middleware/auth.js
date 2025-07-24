import jwt from '@fastify/jwt'

export async function authMiddleware(request, reply) {
  try {
    // Se não houver Authorization, tenta pegar do cookie
    if (!request.headers.authorization && request.cookies.token) {
      request.headers.authorization = `Bearer ${request.cookies.token}`;
    }
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
}

export async function adminMiddleware(request, reply) {
  try {
    // Se não houver Authorization, tenta pegar do cookie
    if (!request.headers.authorization && request.cookies.token) {
      request.headers.authorization = `Bearer ${request.cookies.token}`;
    }
    await request.jwtVerify();
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({
        error: 'Acesso negado. Apenas administradores podem acessar este recurso.'
      });
    }
  } catch (err) {
    reply.send(err);
  }
} 