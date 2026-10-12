import prisma from '../database/client.js'

/**
 * Service Model / Repository
 * Handles raw database operations for nail service items.
 */

export async function findManyServices({ where = {}, orderBy = { name: 'asc' } } = {}) {
  return prisma.service.findMany({
    where,
    orderBy
  })
}

export async function findServiceById(id) {
  return prisma.service.findUnique({
    where: { id }
  })
}

export async function createService(data) {
  return prisma.service.create({
    data
  })
}

export async function updateService(id, data) {
  return prisma.service.update({
    where: { id },
    data
  })
}

export async function deleteService(id) {
  return prisma.service.delete({
    where: { id }
  })
}

export async function countServices(arg = {}) {
  const where = arg.where !== undefined ? arg.where : arg
  return prisma.service.count({
    where
  })
}

export async function groupServicesByCategory() {
  return prisma.service.groupBy({
    by: ['category'],
    _count: { category: true }
  })
}
