import * as authService from '../services/auth.service.js'
import { AppError } from '../errors/AppError.js'

/**
 * Auth Controller
 * Handles HTTP transport concerns for authentication:
 * parsing requests, issuing cookies/tokens, invoking authService, and sending responses.
 */

export async function login(request, reply) {
  try {
    const { email, password } = request.body || {}

    const result = await authService.loginUser(email, password)

    const jwtSigner = request.server?.jwt || this?.jwt
    const token = jwtSigner.sign({
      id: result.user.id,
      email: result.user.email,
      role: result.user.role
    })

    reply.setCookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    })

    return reply.send(result)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}

export async function register(request, reply) {
  try {
    const { name, email, phone, password } = request.body || {}

    const result = await authService.registerUser({ name, email, phone, password })

    const jwtSigner = request.server?.jwt || this?.jwt
    const token = jwtSigner.sign({
      id: result.user.id,
      email: result.user.email,
      role: result.user.role
    })

    reply.setCookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    })

    return reply.status(201).send(result)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}

export async function getMe(request, reply) {
  try {
    const user = await authService.getMe(request.user.id)
    return reply.send({ user })
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}
