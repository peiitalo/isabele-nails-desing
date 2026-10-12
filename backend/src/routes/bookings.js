import * as bookingController from '../controllers/booking.controller.js'

export default async function bookingRoutes(fastify, options) {
  // Listar agendamentos (com filtros)
  fastify.get('/', {
    preHandler: [fastify.authenticate]
  }, bookingController.listBookings)

  // Endpoint de horários disponíveis (suporta query params ?date= e path param /:date)
  fastify.get('/availability', bookingController.getAvailability)
  fastify.get('/availability/:date', bookingController.getAvailability)
  fastify.get('/available-slots', bookingController.getAvailability)
  fastify.get('/available-slots/:date', bookingController.getAvailability)

  // Estatísticas dos agendamentos (apenas admin)
  fastify.get('/stats/dashboard', {
    preHandler: [fastify.adminAuth]
  }, bookingController.getDashboardStats)

  // Rotas de horários de trabalho (admin)
  fastify.get('/working-hours', {
    preHandler: [fastify.adminAuth]
  }, bookingController.listWorkingHours)

  fastify.post('/working-hours', {
    preHandler: [fastify.adminAuth]
  }, bookingController.createWorkingHour)

  fastify.put('/working-hours/:id', {
    preHandler: [fastify.adminAuth]
  }, bookingController.updateWorkingHour)

  fastify.delete('/working-hours/:id', {
    preHandler: [fastify.adminAuth]
  }, bookingController.deleteWorkingHour)

  // Rotas de dias especiais (admin)
  fastify.get('/special-days', {
    preHandler: [fastify.adminAuth]
  }, bookingController.listSpecialDays)

  fastify.post('/special-days', {
    preHandler: [fastify.adminAuth]
  }, bookingController.createSpecialDay)

  fastify.put('/special-days/:id', {
    preHandler: [fastify.adminAuth]
  }, bookingController.updateSpecialDay)

  fastify.delete('/special-days/:id', {
    preHandler: [fastify.adminAuth]
  }, bookingController.deleteSpecialDay)

  // Buscar agendamento por ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate]
  }, bookingController.getBookingById)

  // Criar novo agendamento
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['serviceId', 'date', 'time'],
        properties: {
          serviceId: { type: 'string' },
          date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          time: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
          notes: { type: 'string' }
        }
      }
    }
  }, bookingController.createBooking)

  // Atualizar status do agendamento (apenas admin)
  fastify.patch('/:id/status', {
    preHandler: [fastify.adminAuth],
    schema: {
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
          }
        }
      }
    }
  }, bookingController.updateStatus)

  // Atualizar notas do agendamento (admin)
  fastify.patch('/:id/notes', {
    preHandler: [fastify.adminAuth],
    schema: {
      body: {
        type: 'object',
        required: ['notes'],
        properties: {
          notes: { type: 'string' }
        }
      }
    }
  }, bookingController.updateNotes)

  // Cancelar agendamento (cliente pode cancelar seus próprios)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate]
  }, bookingController.cancelBooking)

  // Endpoint para registrar pagamento (apenas admin)
  fastify.patch('/:id/payment', {
    preHandler: [fastify.adminAuth],
    schema: {
      body: {
        type: 'object',
        required: ['paymentStatus'],
        properties: {
          paymentStatus: { type: 'string', enum: ['PAID', 'UNPAID'] },
          paymentMethod: { type: 'string', enum: ['PIX', 'CASH', 'CARD'] }
        }
      }
    }
  }, bookingController.updatePayment)
}