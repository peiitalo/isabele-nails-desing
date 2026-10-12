import * as servicesService from '../services/services.service.js'
import { AppError } from '../errors/AppError.js'

/**
 * Service Controller
 * Handles HTTP requests and responses for nail service endpoints.
 */

export async function listServices(request, reply) {
  try {
    const { category, isActive } = request.query || {}
    const services = await servicesService.listServices({ category, isActive })
    return reply.send(services)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}

export async function getServiceById(request, reply) {
  try {
    const { id } = request.params
    const service = await servicesService.getServiceById(id)
    return reply.send(service)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}

export async function createService(request, reply) {
  try {
    const service = await servicesService.createService(request.body)
    return reply.status(201).send(service)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}

export async function updateService(request, reply) {
  try {
    const { id } = request.params
    const service = await servicesService.updateService(id, request.body)
    return reply.send(service)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}

export async function deleteService(request, reply) {
  try {
    const { id } = request.params
    await servicesService.deleteService(id)
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
    const stats = await servicesService.getServicesStats()
    return reply.send(stats)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}
