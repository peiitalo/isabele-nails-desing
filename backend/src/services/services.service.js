/**
 * Services Service
 *
 * Business logic for the nail-services catalogue:
 *   - listServices       → filterable list
 *   - getServiceById     → single service or 404
 *   - createService      → create a new entry
 *   - updateService      → update fields or 404
 *   - deleteService      → delete or 404
 *   - getServicesStats   → aggregate statistics
 */

import * as serviceModel from '../models/service.model.js'
import * as bookingModel from '../models/booking.model.js'
import { AppError } from '../errors/AppError.js'

/**
 * Return all services, optionally filtered by category and/or isActive.
 *
 * @param {{ category?: string, isActive?: string }} filters
 * @returns {Promise<object[]>}
 */
export async function listServices({ category, isActive } = {}) {
  const where = {}

  if (category) {
    where.category = category
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true'
  }

  return serviceModel.findManyServices({
    where,
    orderBy: { name: 'asc' }
  })
}

/**
 * Find a single service by ID.
 *
 * @param {string} id
 * @returns {Promise<object>}
 * @throws {AppError} 404 if not found
 */
export async function getServiceById(id) {
  const service = await serviceModel.findServiceById(id)

  if (!service) {
    throw new AppError(404, 'Serviço não encontrado')
  }

  return service
}

/**
 * Create a new service.
 *
 * @param {{ name: string, description: string, price: number, duration: number, category: string, isActive?: boolean }} data
 * @returns {Promise<object>}
 */
export async function createService(data) {
  return serviceModel.createService(data)
}

/**
 * Update an existing service.
 *
 * @param {string} id
 * @param {Partial<{name, description, price, duration, category, isActive}>} data
 * @returns {Promise<object>}
 * @throws {AppError} 404 if not found
 */
export async function updateService(id, data) {
  try {
    return await serviceModel.updateService(id, data)
  } catch (err) {
    if (err.code === 'P2025') {
      throw new AppError(404, 'Serviço não encontrado')
    }
    throw err
  }
}

/**
 * Delete a service by ID.
 *
 * @param {string} id
 * @returns {Promise<void>}
 * @throws {AppError} 404 if not found
 */
export async function deleteService(id) {
  try {
    await serviceModel.deleteService(id)
  } catch (err) {
    if (err.code === 'P2025') {
      throw new AppError(404, 'Serviço não encontrado')
    }
    throw err
  }
}

/**
 * Aggregate service statistics for the admin dashboard.
 *
 * @returns {Promise<{totalServices: number, activeServices: number, servicesByCategory: object[], totalRevenue: number}>}
 */
export async function getServicesStats() {
  const totalServices = await serviceModel.countServices()
  const activeServices = await serviceModel.countServices({ isActive: true })

  const servicesByCategory = await serviceModel.groupServicesByCategory()

  const completedBookings = await bookingModel.findCompletedBookingsWithServicePrice()

  const totalRevenue = completedBookings.reduce(
    (sum, b) => sum + (b.service?.price || 0),
    0
  )

  return { totalServices, activeServices, servicesByCategory, totalRevenue }
}
