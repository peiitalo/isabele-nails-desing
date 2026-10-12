import prisma from '../database/client.js'

/**
 * Auth Model / Repository
 * Handles raw database operations for authentication workflows.
 */

export async function findUserByEmail(email, select) {
  const query = { where: { email } }
  if (select) query.select = select
  return prisma.user.findUnique(query)
}

export async function createUser(data, select) {
  const query = { data }
  if (select) query.select = select
  return prisma.user.create(query)
}

export async function findUserById(id, select) {
  const query = { where: { id } }
  if (select) query.select = select
  return prisma.user.findUnique(query)
}
