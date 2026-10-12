import * as bookingsService from '../services/bookings.service.js'
import { AppError } from '../errors/AppError.js'

/**
 * Booking Controller
 * Handles HTTP requests and responses for Bookings, WorkingHours, and SpecialDays.
 */

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export async function listBookings(request, reply) {
  try {
    const bookings = await bookingsService.listBookings(request.user, request.query)
    return reply.send(bookings)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}

export async function getBookingById(request, reply) {
  try {
    const { id } = request.params
    const booking = await bookingsService.getBookingById(id, request.user)
    return reply.send(booking)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}

export async function createBooking(request, reply) {
  try {
    const booking = await bookingsService.createBooking(request.user, request.body)
    return reply.status(201).send(booking)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}

export async function updateStatus(request, reply) {
  try {
    const { id } = request.params
    const booking = await bookingsService.updateBookingStatus(id, request.body)
    return reply.send(booking)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}

export async function updateNotes(request, reply) {
  try {
    const { id } = request.params
    const { notes } = request.body || {}
    const booking = await bookingsService.updateBookingNotes(id, notes)
    return reply.send(booking)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro ao atualizar motivo do cancelamento' })
  }
}

export async function cancelBooking(request, reply) {
  try {
    const { id } = request.params
    await bookingsService.cancelBooking(id, request.user)
    return reply.status(204).send()
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}

export async function updatePayment(request, reply) {
  try {
    const { id } = request.params
    const booking = await bookingsService.updateBookingPayment(id, request.body)
    return reply.send(booking)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}

export async function getAvailability(request, reply) {
  try {
    const date = request.params?.date || request.query?.date
    const serviceId = request.query?.serviceId || request.params?.serviceId

    if (!date) {
      return reply.status(400).send({ error: 'Data não informada' })
    }

    const slots = await bookingsService.getAvailability(date, serviceId)
    return reply.send(slots)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}

export const getAvailableSlots = getAvailability

export async function getDashboardStats(request, reply) {
  try {
    const stats = await bookingsService.getDashboardStats()
    return reply.send(stats)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  }
}

// ---------------------------------------------------------------------------
// Working Hours
// ---------------------------------------------------------------------------

export async function listWorkingHours(request, reply) {
  try {
    const hours = await bookingsService.listWorkingHours()
    return reply.send(hours)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro ao buscar horários' })
  }
}

export async function createWorkingHour(request, reply) {
  try {
    const hour = await bookingsService.createWorkingHour(request.body)
    return reply.status(201).send(hour)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro ao criar horário' })
  }
}

export async function updateWorkingHour(request, reply) {
  try {
    const { id } = request.params
    const hour = await bookingsService.updateWorkingHour(id, request.body)
    return reply.send(hour)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro ao atualizar horário' })
  }
}

export async function deleteWorkingHour(request, reply) {
  try {
    const { id } = request.params
    await bookingsService.deleteWorkingHour(id)
    return reply.status(204).send()
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro ao deletar horário' })
  }
}

// ---------------------------------------------------------------------------
// Special Days
// ---------------------------------------------------------------------------

export async function listSpecialDays(request, reply) {
  try {
    const days = await bookingsService.listSpecialDays()
    return reply.send(days)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro ao buscar dias especiais' })
  }
}

export async function createSpecialDay(request, reply) {
  try {
    const day = await bookingsService.createSpecialDay(request.body)
    return reply.status(201).send(day)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro ao criar dia especial' })
  }
}

export async function updateSpecialDay(request, reply) {
  try {
    const { id } = request.params
    const day = await bookingsService.updateSpecialDay(id, request.body)
    return reply.send(day)
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro ao atualizar dia especial' })
  }
}

export async function deleteSpecialDay(request, reply) {
  try {
    const { id } = request.params
    await bookingsService.deleteSpecialDay(id)
    return reply.status(204).send()
  } catch (error) {
    if (error instanceof AppError || error.statusCode) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    return reply.status(500).send({ error: 'Erro ao deletar dia especial' })
  }
}
