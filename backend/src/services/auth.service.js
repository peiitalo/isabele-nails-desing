/**
 * Auth Service
 *
 * Handles all business logic for authentication:
 *   - loginUser      → validates credentials, returns user data
 *   - registerUser   → creates new client account, returns user data
 *   - getMe          → fetches authenticated user's profile
 *
 * JWT signing and cookie management are intentionally NOT here;
 * those are transport-layer concerns handled in the controller.
 */

import bcrypt from 'bcryptjs'
import * as authModel from '../models/auth.model.js'
import { AppError } from '../errors/AppError.js'

/**
 * Validate credentials and return the user (without password).
 *
 * @param {string} email
 * @param {string} password  - plain-text password
 * @returns {Promise<{user: object}>}
 * @throws {AppError} 401 if credentials are invalid
 */
export async function loginUser(email, password) {
  const user = await authModel.findUserByEmail(email)

  if (!user) {
    throw new AppError(401, 'Email ou senha incorretos')
  }

  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    throw new AppError(401, 'Email ou senha incorretos')
  }

  const { password: _, ...userWithoutPassword } = user
  return { user: userWithoutPassword }
}

/**
 * Create a new CLIENT account.
 *
 * @param {{name: string, email: string, phone: string, password: string}} data
 * @returns {Promise<{user: object}>}
 * @throws {AppError} 400 if the email is already registered
 */
export async function registerUser({ name, email, phone, password }) {
  const existing = await authModel.findUserByEmail(email)

  if (existing) {
    throw new AppError(400, 'Email já cadastrado')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await authModel.createUser({
    name,
    email,
    phone,
    password: hashedPassword,
    role: 'CLIENT'
  })

  const { password: _, ...userWithoutPassword } = user
  return { user: userWithoutPassword }
}

/**
 * Fetch the authenticated user's profile (no password field).
 *
 * @param {string} userId
 * @returns {Promise<object>}
 * @throws {AppError} 404 if user no longer exists
 */
export async function getMe(userId) {
  const user = await authModel.findUserById(userId, {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    createdAt: true
  })

  if (!user) {
    throw new AppError(404, 'Usuário não encontrado')
  }

  return user
}
