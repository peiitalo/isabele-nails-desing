import * as usersService from '../services/users.service.js'
import { AppError } from '../errors/AppError.js'

/**
 * User Controller
 * Handles HTTP requests and responses for user endpoints.
 */

export async function listUsers(request, reply) {
  try {
    const { role, search } = request.query || {}
    const users = await usersService.listUsers({ role, search })
    return reply.send(users)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}

export async function getUserById(request, reply) {
  try {
    const { id } = request.params
    const userData = await usersService.getUserById(id, request.user)
    return reply.send(userData)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}

export async function updateUser(request, reply) {
  try {
    const { id } = request.params
    const updatedUser = await usersService.updateUser(id, request.body, request.user)
    return reply.send(updatedUser)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}

export async function changePassword(request, reply) {
  try {
    const { id } = request.params
    const { currentPassword, newPassword } = request.body || {}
    await usersService.changePassword(id, { currentPassword, newPassword }, request.user)
    return reply.send({ message: 'Senha alterada com sucesso' })
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}

export async function deleteUser(request, reply) {
  try {
    const { id } = request.params
    await usersService.deleteUser(id)
    return reply.status(204).send()
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}

export async function getStats(request, reply) {
  try {
    const stats = await usersService.getUsersStats()
    return reply.send(stats)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}
