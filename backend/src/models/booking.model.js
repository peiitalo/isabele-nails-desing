import prisma from '../database/client.js'

/**
 * Booking Model / Repository
 * Handles raw database operations for Bookings, WorkingHours, and SpecialDays.
 */

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export async function findManyBookings({ where = {}, include, orderBy = [{ date: 'asc' }, { time: 'asc' }] } = {}) {
  const query = { where, orderBy }
  if (include) query.include = include
  return prisma.booking.findMany(query)
}

export async function findBookingById(id, { include } = {}) {
  const query = { where: { id } }
  if (include) query.include = include
  return prisma.booking.findUnique(query)
}

export async function findFirstBooking(where, { include } = {}) {
  const query = { where }
  if (include) query.include = include
  return prisma.booking.findFirst(query)
}

export async function createBooking({ data, include } = {}) {
  const query = { data }
  if (include) query.include = include
  return prisma.booking.create(query)
}

export async function updateBooking(id, { data, include } = {}) {
  const query = { where: { id }, data }
  if (include) query.include = include
  return prisma.booking.update(query)
}

export async function deleteBooking(id) {
  return prisma.booking.delete({ where: { id } })
}

export async function countBookings(arg = {}) {
  const where = arg.where !== undefined ? arg.where : arg
  return prisma.booking.count({ where })
}

export async function findCompletedBookingsWithServicePrice() {
  return prisma.booking.findMany({
    where: { status: 'COMPLETED' },
    include: { service: { select: { price: true } } }
  })
}

export async function findBookingsByClientId(clientId) {
  return prisma.booking.findMany({
    where: { clientId }
  })
}

// ---------------------------------------------------------------------------
// Working Hours
// ---------------------------------------------------------------------------

export async function findManyWorkingHours({ where = {}, orderBy = [{ weekday: 'asc' }, { startTime: 'asc' }] } = {}) {
  const normalizedWhere = { ...where }
  if (normalizedWhere.weekday !== undefined && typeof normalizedWhere.weekday !== 'number') {
    normalizedWhere.weekday = Number(normalizedWhere.weekday)
  }
  return prisma.workingHour.findMany({
    where: normalizedWhere,
    orderBy
  })
}

export async function findWorkingHourById(id) {
  return prisma.workingHour.findUnique({
    where: { id }
  })
}

export async function createWorkingHour(data) {
  const payload = {
    ...data,
    ...(data.weekday !== undefined ? { weekday: Number(data.weekday) } : {})
  }
  return prisma.workingHour.create({
    data: payload
  })
}

export async function updateWorkingHour(id, data) {
  const payload = {
    ...data,
    ...(data.weekday !== undefined ? { weekday: Number(data.weekday) } : {})
  }
  return prisma.workingHour.update({
    where: { id },
    data: payload
  })
}

export async function deleteWorkingHour(id) {
  return prisma.workingHour.delete({
    where: { id }
  })
}

// ---------------------------------------------------------------------------
// Special Days
// ---------------------------------------------------------------------------

function sanitizeSpecialDayDate(date) {
  if (!date) return date
  const match = String(date).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
  }
  return String(date).split('T')[0]
}

export async function findManySpecialDays({ where = {}, orderBy = [{ date: 'asc' }, { startTime: 'asc' }] } = {}) {
  const normalizedWhere = { ...where }
  if (normalizedWhere.date) {
    normalizedWhere.date = sanitizeSpecialDayDate(normalizedWhere.date)
  }
  return prisma.specialDay.findMany({
    where: normalizedWhere,
    orderBy
  })
}

export async function findSpecialDayById(id) {
  return prisma.specialDay.findUnique({
    where: { id }
  })
}

export async function createSpecialDay(data) {
  const payload = {
    ...data,
    ...(data.date ? { date: sanitizeSpecialDayDate(data.date) } : {})
  }
  return prisma.specialDay.create({
    data: payload
  })
}

export async function updateSpecialDay(id, data) {
  const payload = {
    ...data,
    ...(data.date ? { date: sanitizeSpecialDayDate(data.date) } : {})
  }
  return prisma.specialDay.update({
    where: { id },
    data: payload
  })
}

export async function deleteSpecialDay(id) {
  return prisma.specialDay.delete({
    where: { id }
  })
}
