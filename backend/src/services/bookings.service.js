/**
 * Bookings Service
 *
 * All booking business logic:
 *   - listBookings          → scoped by role, with optional filters
 *   - getBookingById        → single booking, enforcing ownership for CLIENTs
 *   - createBooking         → validate slot + service, then create
 *   - updateBookingStatus   → admin status transition
 *   - updateBookingNotes    → admin notes update
 *   - cancelBooking         → CLIENT can cancel own PENDING bookings
 *   - updateBookingPayment  → admin payment recording
 *   - getAvailability       → compute free/busy slots for a date
 *   - getDashboardStats     → aggregate stats
 *
 * Working Hours CRUD:
 *   - listWorkingHours / createWorkingHour / updateWorkingHour / deleteWorkingHour
 *
 * Special Days CRUD:
 *   - listSpecialDays / createSpecialDay / updateSpecialDay / deleteSpecialDay
 */

import * as bookingModel from '../models/booking.model.js'
import * as serviceModel from '../models/service.model.js'
import { AppError } from '../errors/AppError.js'

// ---------------------------------------------------------------------------
// Shared include fragments
// ---------------------------------------------------------------------------

const BOOKING_CLIENT_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true
}

const BOOKING_SERVICE_SELECT = {
  id: true,
  name: true,
  price: true,
  duration: true
}

/** Map a raw Prisma booking row to the shape expected by the frontend. */
function mapBooking(b) {
  return {
    ...b,
    clientName: b.client?.name || '',
    clientPhone: b.client?.phone || '',
    serviceName: b.service?.name || '',
    servicePrice: b.service?.price || 0,
    createdBy: b.createdBy || (b.client?.role === 'ADMIN' ? 'ADMIN' : 'CLIENT')
  }
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

/**
 * List bookings. CLIENTs only see their own; ADMINs can filter by clientId.
 *
 * @param {{ id: string, role: string }} user  - decoded JWT payload
 * @param {{ status?, date?, clientId?, serviceId? }} filters
 * @returns {Promise<object[]>}
 */
export async function listBookings(user, { status, date, clientId, serviceId } = {}) {
  const where = {}

  if (user.role === 'CLIENT') {
    where.clientId = user.id
  }

  if (status) where.status = status
  if (date) where.date = date
  if (clientId && user.role === 'ADMIN') where.clientId = clientId
  if (serviceId) where.serviceId = serviceId

  const bookings = await bookingModel.findManyBookings({
    where,
    include: {
      client: { select: BOOKING_CLIENT_SELECT },
      service: { select: BOOKING_SERVICE_SELECT }
    },
    orderBy: [{ date: 'asc' }, { time: 'asc' }]
  })

  return bookings.map(mapBooking)
}

/**
 * Fetch a single booking by ID.
 * CLIENTs can only view their own bookings.
 *
 * @param {string} id
 * @param {{ id: string, role: string }} user
 * @returns {Promise<object>}
 * @throws {AppError} 404 / 403
 */
export async function getBookingById(id, user) {
  const booking = await bookingModel.findBookingById(id, {
    include: {
      client: { select: BOOKING_CLIENT_SELECT },
      service: {
        select: { ...BOOKING_SERVICE_SELECT, description: true }
      }
    }
  })

  if (!booking) {
    throw new AppError(404, 'Agendamento não encontrado')
  }

  if (user.role === 'CLIENT' && booking.clientId !== user.id) {
    throw new AppError(403, 'Acesso negado')
  }

  return booking
}

/**
 * Create a new booking for the authenticated user.
 *
 * @param {{ id: string, role: string }} user
 * @param {{ serviceId: string, date: string, time: string, notes?: string, status?: string }} data
 * @returns {Promise<object>}
 * @throws {AppError} 404 if service not found
 * @throws {AppError} 400 if service inactive or slot taken
 */
export async function createBooking(user, { serviceId, date, time, notes, status: requestedStatus }) {
  const service = await serviceModel.findServiceById(serviceId)

  if (!service) {
    throw new AppError(404, 'Serviço não encontrado')
  }

  if (!service.isActive) {
    throw new AppError(400, 'Serviço não está disponível')
  }

  const existingBooking = await bookingModel.findFirstBooking({
    date,
    time,
    status: { in: ['PENDING', 'CONFIRMED'] }
  })

  if (existingBooking) {
    throw new AppError(400, 'Horário já está ocupado')
  }

  const createdBy = user.role === 'ADMIN' ? 'ADMIN' : 'CLIENT'
  const status = requestedStatus || (user.role === 'ADMIN' ? 'CONFIRMED' : 'PENDING')

  const booking = await bookingModel.createBooking({
    data: { clientId: user.id, serviceId, date, time, notes, status, createdBy },
    include: {
      client: { select: BOOKING_CLIENT_SELECT },
      service: { select: BOOKING_SERVICE_SELECT }
    }
  })

  return { ...booking, createdBy }
}

/**
 * Update the status of a booking (admin-only).
 *
 * @param {string} id
 * @param {{ status: string, notes?: string }} data
 * @returns {Promise<object>}
 * @throws {AppError} 404 if not found
 */
export async function updateBookingStatus(id, { status, notes }) {
  try {
    return await bookingModel.updateBooking(id, {
      data: {
        status,
        ...(status === 'CANCELLED' && notes ? { notes } : {})
      },
      include: {
        client: { select: BOOKING_CLIENT_SELECT },
        service: { select: BOOKING_SERVICE_SELECT }
      }
    })
  } catch (err) {
    if (err.code === 'P2025') {
      throw new AppError(404, 'Agendamento não encontrado')
    }
    throw err
  }
}

/**
 * Update the notes of a booking (admin-only).
 *
 * @param {string} id
 * @param {string} notes
 * @returns {Promise<object>}
 */
export async function updateBookingNotes(id, notes) {
  try {
    return await bookingModel.updateBooking(id, { data: { notes } })
  } catch (err) {
    if (err.code === 'P2025') {
      throw new AppError(404, 'Agendamento não encontrado')
    }
    throw err
  }
}

/**
 * Cancel a booking.
 * CLIENTs may only cancel their own PENDING bookings.
 * ADMINs may cancel any booking.
 *
 * @param {string} id
 * @param {{ id: string, role: string }} user
 * @returns {Promise<void>}
 * @throws {AppError} 404 / 403
 */
export async function cancelBooking(id, user) {
  const booking = await bookingModel.findBookingById(id, {
    include: { client: true }
  })

  if (!booking) {
    throw new AppError(404, 'Agendamento não encontrado')
  }

  if (user.role === 'CLIENT') {
    if (booking.clientId !== user.id) {
      throw new AppError(403, 'Acesso negado')
    }
    if (booking.status !== 'PENDING') {
      throw new AppError(403, 'Só é possível cancelar agendamentos pendentes.')
    }
  }

  await bookingModel.updateBooking(id, { data: { status: 'CANCELLED' } })
}

/**
 * Record payment information for a booking (admin-only).
 *
 * @param {string} id
 * @param {{ paymentStatus: string, paymentMethod?: string }} data
 * @returns {Promise<object>}
 * @throws {AppError} 404 if not found
 */
export async function updateBookingPayment(id, { paymentStatus, paymentMethod }) {
  try {
    return await bookingModel.updateBooking(id, {
      data: {
        paymentStatus,
        ...(paymentMethod ? { paymentMethod } : {})
      },
      include: {
        client: { select: BOOKING_CLIENT_SELECT },
        service: { select: BOOKING_SERVICE_SELECT }
      }
    })
  } catch (err) {
    if (err.code === 'P2025') {
      throw new AppError(404, 'Agendamento não encontrado')
    }
    throw err
  }
}

/**
 * Return available and unavailable 30-minute time slots for a given date.
 * Prioritises SpecialDay overrides over recurring WorkingHour configuration.
 *
 * @param {string} date      - YYYY-MM-DD
 * @param {string} [serviceId]
 * @returns {Promise<{time: string, available: boolean}[]>}
 */
export async function getAvailability(date, serviceId) {
  let serviceDuration = 0

  if (serviceId) {
    const service = await serviceModel.findServiceById(serviceId)
    serviceDuration = service?.duration || 0
  }

  // 1. Check for a special-day override first
  const specialDays = await bookingModel.findManySpecialDays({
    where: { date },
    orderBy: [{ startTime: 'asc' }]
  })

  let workingHours = []

  if (specialDays.length > 0) {
    workingHours = specialDays.map(s => ({ startTime: s.startTime, endTime: s.endTime }))
  } else {
    const weekday = new Date(date + 'T00:00:00').getDay()
    workingHours = await bookingModel.findManyWorkingHours({
      where: { weekday },
      orderBy: [{ startTime: 'asc' }]
    })
  }

  // 2. Generate all 30-minute slots within working hours
  const timeSlots = []
  for (const wh of workingHours) {
    let [h, m] = wh.startTime.split(':').map(Number)
    const [endH, endM] = wh.endTime.split(':').map(Number)

    while (h < endH || (h === endH && m < endM)) {
      timeSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
      m += 30
      if (m >= 60) { h++; m = 0 }
    }
  }

  // 3. Find active bookings for this date and mark occupied intervals
  const bookings = await bookingModel.findManyBookings({
    where: { date, status: { in: ['PENDING', 'CONFIRMED'] } },
    include: { service: { select: { duration: true } } }
  })

  const occupiedTimes = new Set()
  for (const b of bookings) {
    const duration = b.service?.duration || 0
    let [h, m] = b.time.split(':').map(Number)
    const steps = Math.ceil(duration / 30)

    for (let i = 0; i < steps; i++) {
      occupiedTimes.add(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
      m += 30
      if (m >= 60) { h++; m = 0 }
    }
  }

  // 4. Build availability response
  return timeSlots.map(time => {
    if (!serviceId || !serviceDuration) {
      return { time, available: !occupiedTimes.has(time) }
    }

    let [h, m] = time.split(':').map(Number)
    let canBook = true

    for (let i = 0; i < Math.ceil(serviceDuration / 30); i++) {
      const t = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      if (!timeSlots.includes(t) || occupiedTimes.has(t)) {
        canBook = false
        break
      }
      m += 30
      if (m >= 60) { h++; m = 0 }
    }

    return { time, available: canBook }
  })
}

/**
 * Aggregate booking statistics for the admin dashboard.
 *
 * @returns {Promise<{totalBookings, pendingBookings, completedBookings, todayBookings, totalRevenue}>}
 */
export async function getDashboardStats() {
  const today = new Date().toISOString().split('T')[0]

  const [totalBookings, pendingBookings, completedBookings, todayBookings, completed] =
    await Promise.all([
      bookingModel.countBookings(),
      bookingModel.countBookings({ where: { status: 'PENDING' } }),
      bookingModel.countBookings({ where: { status: 'COMPLETED' } }),
      bookingModel.countBookings({ where: { date: today } }),
      bookingModel.findCompletedBookingsWithServicePrice()
    ])

  const totalRevenue = completed.reduce((sum, b) => sum + (b.service?.price || 0), 0)

  return { totalBookings, pendingBookings, completedBookings, todayBookings, totalRevenue }
}

// ---------------------------------------------------------------------------
// Working Hours
// ---------------------------------------------------------------------------

/** List all working hour records ordered by weekday then start time. */
export async function listWorkingHours() {
  return bookingModel.findManyWorkingHours({
    orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }]
  })
}

/**
 * Create a new working hour record.
 * @param {{ weekday: number, startTime: string, endTime: string }} data
 */
export async function createWorkingHour(data) {
  return bookingModel.createWorkingHour(data)
}

/**
 * Update a working hour record.
 * @param {string} id
 * @param {{ weekday: number, startTime: string, endTime: string }} data
 */
export async function updateWorkingHour(id, data) {
  return bookingModel.updateWorkingHour(id, data)
}

/**
 * Delete a working hour record.
 * @param {string} id
 */
export async function deleteWorkingHour(id) {
  await bookingModel.deleteWorkingHour(id)
}

// ---------------------------------------------------------------------------
// Special Days
// ---------------------------------------------------------------------------

/** List all special day records ordered by date then start time. */
export async function listSpecialDays() {
  return bookingModel.findManySpecialDays({
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
  })
}

/**
 * Create a new special day override.
 * @param {{ date: string, startTime: string, endTime: string }} data
 */
export async function createSpecialDay(data) {
  return bookingModel.createSpecialDay(data)
}

/**
 * Update a special day override.
 * @param {string} id
 * @param {{ date: string, startTime: string, endTime: string }} data
 */
export async function updateSpecialDay(id, data) {
  return bookingModel.updateSpecialDay(id, data)
}

/**
 * Delete a special day override.
 * @param {string} id
 */
export async function deleteSpecialDay(id) {
  await bookingModel.deleteSpecialDay(id)
}
