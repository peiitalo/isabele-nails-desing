import prisma from '../database/client.js'

/**
 * User Model / Repository
 * Handles raw database operations for the User entity.
 */

export async function findUserById(id, select) {
  const query = { where: { id } }
  if (select) query.select = select
  return prisma.user.findUnique(query)
}

export async function findUserByEmail(email, select) {
  const query = { where: { email } }
  if (select) query.select = select
  return prisma.user.findUnique(query)
}

export async function findFirstUser(where, select) {
  const query = { where }
  if (select) query.select = select
  return prisma.user.findFirst(query)
}

export async function findManyUsers({ where = {}, select, orderBy = { name: 'asc' } } = {}) {
  const query = { where, orderBy }
  if (select) query.select = select
  return prisma.user.findMany(query)
}

export async function createUser(data, select) {
  const query = { data }
  if (select) query.select = select
  return prisma.user.create(query)
}

export async function updateUser(id, data, select) {
  const query = { where: { id }, data }
  if (select) query.select = select
  return prisma.user.update(query)
}

export async function deleteUser(id) {
  return prisma.user.delete({ where: { id } })
}

export async function countUsers(arg = {}) {
  const where = arg.where !== undefined ? arg.where : arg
  return prisma.user.count({ where })
}
