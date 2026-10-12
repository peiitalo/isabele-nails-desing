/**
 * Users Service
 *
 * Business logic for user management:
 *   - listUsers        → filterable, admin-only list
 *   - getUserById      → single user with bookings, or 404/403
 *   - updateUser       → update profile fields or 404/400/403
 *   - changePassword   → verify current pw then update, or 400/403/404
 *   - deleteUser       → admin delete, blocked if user has bookings
 *   - getUsersStats    → aggregate statistics for admin dashboard
 */

import bcrypt from 'bcryptjs'
import * as userModel from '../models/user.model.js'
import * as bookingModel from '../models/booking.model.js'
import { AppError } from '../errors/AppError.js'

/**
 * List all users with optional role/search filters.
 * Admin-only operation (caller should enforce via middleware).
 *
 * @param {{ role?: string, search?: string }} filters
 * @returns {Promise<object[]>}
 */
export async function listUsers({ role, search } = {}) {
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

  return userModel.findManyUsers({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: { select: { bookings: true } }
    },
    orderBy: { name: 'asc' }
  })
}

/**
 * Fetch a single user's profile including their booking history.
 *
 * @param {string} targetId  - ID of the user to fetch
 * @param {{ id: string, role: string }} requester  - decoded JWT payload
 * @returns {Promise<object>}
 * @throws {AppError} 403 if a CLIENT tries to view another user's data
 * @throws {AppError} 404 if user does not exist
 */
export async function getUserById(targetId, requester) {
  if (requester.role === 'CLIENT' && requester.id !== targetId) {
    throw new AppError(403, 'Acesso negado')
  }

  const user = await userModel.findUserById(targetId, {
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
        service: { select: { name: true, price: true } }
      },
      orderBy: [{ date: 'desc' }, { time: 'desc' }]
    }
  })

  if (!user) {
    throw new AppError(404, 'Usuário não encontrado')
  }

  return user
}

/**
 * Update a user's profile (name, email, phone).
 *
 * @param {string} targetId
 * @param {Partial<{name: string, email: string, phone: string}>} data
 * @param {{ id: string, role: string }} requester
 * @returns {Promise<object>}
 * @throws {AppError} 403 if a CLIENT tries to update another user
 * @throws {AppError} 400 if the new email is already taken
 * @throws {AppError} 404 if the target user does not exist
 */
export async function updateUser(targetId, data, requester) {
  if (requester.role === 'CLIENT' && requester.id !== targetId) {
    throw new AppError(403, 'Acesso negado')
  }

  if (data.email) {
    const existing = await userModel.findFirstUser({
      email: data.email,
      id: { not: targetId }
    })

    if (existing) {
      throw new AppError(400, 'Email já está em uso')
    }
  }

  try {
    return await userModel.updateUser(targetId, data, {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true
    })
  } catch (err) {
    if (err.code === 'P2025') {
      throw new AppError(404, 'Usuário não encontrado')
    }
    throw err
  }
}

/**
 * Change a user's password after verifying the current one.
 *
 * @param {string} targetId
 * @param {{ currentPassword: string, newPassword: string }} passwords
 * @param {{ id: string, role: string }} requester
 * @returns {Promise<void>}
 * @throws {AppError} 403 if a CLIENT tries to change another user's password
 * @throws {AppError} 404 if target user does not exist
 * @throws {AppError} 400 if currentPassword is wrong
 */
export async function changePassword(targetId, { currentPassword, newPassword }, requester) {
  if (requester.role === 'CLIENT' && requester.id !== targetId) {
    throw new AppError(403, 'Acesso negado')
  }

  const userData = await userModel.findUserById(targetId, {
    id: true,
    password: true
  })

  if (!userData) {
    throw new AppError(404, 'Usuário não encontrado')
  }

  const isValid = await bcrypt.compare(currentPassword, userData.password)
  if (!isValid) {
    throw new AppError(400, 'Senha atual incorreta')
  }

  const hashed = await bcrypt.hash(newPassword, 10)
  await userModel.updateUser(targetId, { password: hashed })
}

/**
 * Delete a user (admin-only).
 * Blocked if the user still has bookings in the system.
 *
 * @param {string} targetId
 * @returns {Promise<void>}
 * @throws {AppError} 400 if user has bookings
 * @throws {AppError} 404 if user does not exist
 */
export async function deleteUser(targetId) {
  const bookings = await bookingModel.findBookingsByClientId(targetId)

  if (bookings.length > 0) {
    throw new AppError(400, 'Não é possível deletar um usuário que possui agendamentos')
  }

  try {
    await userModel.deleteUser(targetId)
  } catch (err) {
    if (err.code === 'P2025') {
      throw new AppError(404, 'Usuário não encontrado')
    }
    throw err
  }
}

/**
 * Aggregate user statistics for the admin dashboard.
 *
 * @returns {Promise<{totalUsers, totalClients, totalAdmins, activeClients, totalRevenue}>}
 */
export async function getUsersStats() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const [totalUsers, totalClients, totalAdmins, activeClients] = await Promise.all([
    userModel.countUsers(),
    userModel.countUsers({ role: 'CLIENT' }),
    userModel.countUsers({ role: 'ADMIN' }),
    userModel.countUsers({
      role: 'CLIENT',
      bookings: { some: { date: { gte: thirtyDaysAgo } } }
    })
  ])

  const completedBookings = await bookingModel.findCompletedBookingsWithServicePrice()

  const totalRevenue = completedBookings.reduce(
    (sum, b) => sum + (b.service?.price || 0),
    0
  )

  return { totalUsers, totalClients, totalAdmins, activeClients, totalRevenue }
}
