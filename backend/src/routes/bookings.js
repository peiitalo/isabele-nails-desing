import prisma from '../database/client.js'

export default async function bookingRoutes(fastify, options) {
  // Listar agendamentos (com filtros)
  fastify.get('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { status, date, clientId, serviceId } = request.query
      const user = request.user
      
      const where = {}
      
      // Se for cliente, só pode ver seus próprios agendamentos
      if (user.role === 'CLIENT') {
        where.clientId = user.id
      }
      
      if (status) {
        where.status = status
      }
      
      if (date) {
        where.date = date
      }
      
      if (clientId && user.role === 'ADMIN') {
        where.clientId = clientId
      }
      
      if (serviceId) {
        where.serviceId = serviceId
      }

      const bookings = await prisma.booking.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              price: true,
              duration: true
            }
          }
        },
        orderBy: [
          { date: 'asc' },
          { time: 'asc' }
        ]
      })

      // Mapeia os campos para o formato esperado pelo frontend
      const bookingsMapped = bookings.map(b => ({
        ...b,
        clientName: b.client?.name || '',
        clientPhone: b.client?.phone || '',
        serviceName: b.service?.name || '',
        servicePrice: b.service?.price || 0,
        createdBy: b.createdBy || (b.client?.role === 'ADMIN' ? 'ADMIN' : 'CLIENT')
      }))

      reply.send(bookingsMapped)
    } catch (error) {
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })

  // Buscar agendamento por ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { id } = request.params
      const user = request.user

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              price: true,
              duration: true,
              description: true
            }
          }
        }
      })

      if (!booking) {
        return reply.status(404).send({
          error: 'Agendamento não encontrado'
        })
      }

      // Verificar se o usuário tem permissão para ver este agendamento
      if (user.role === 'CLIENT' && booking.clientId !== user.id) {
        return reply.status(403).send({
          error: 'Acesso negado'
        })
      }

      reply.send(booking)
    } catch (error) {
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })

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
  }, async (request, reply) => {
    try {
      const { serviceId, date, time, notes } = request.body
      const user = request.user

      // Verificar se o serviço existe e está ativo
      const service = await prisma.service.findUnique({
        where: { id: serviceId }
      })

      if (!service) {
        return reply.status(404).send({
          error: 'Serviço não encontrado'
        })
      }

      if (!service.isActive) {
        return reply.status(400).send({
          error: 'Serviço não está disponível'
        })
      }

      // Verificar se já existe agendamento para este horário
      const existingBooking = await prisma.booking.findFirst({
        where: {
          date,
          time,
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        }
      })

      if (existingBooking) {
        return reply.status(400).send({
          error: 'Horário já está ocupado'
        })
      }

      // Criar agendamento
      const createdBy = user.role === 'ADMIN' ? 'ADMIN' : 'CLIENT';
      const status = request.body.status || (user.role === 'ADMIN' ? 'CONFIRMED' : 'PENDING');
      const booking = await prisma.booking.create({
        data: {
          clientId: user.id,
          serviceId,
          date,
          time,
          notes,
          status,
          createdBy
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              price: true,
              duration: true
            }
          }
        }
      })

      // Adiciona o campo createdBy na resposta
      const bookingWithCreatedBy = {
        ...booking,
        createdBy
      }

      reply.status(201).send(bookingWithCreatedBy)
    } catch (error) {
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })

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
  }, async (request, reply) => {
    try {
      const { id } = request.params
      const { status } = request.body

      const booking = await prisma.booking.update({
        where: { id },
        data: { status },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              price: true,
              duration: true
            }
          }
        }
      })

      reply.send(booking)
    } catch (error) {
      if (error.code === 'P2025') {
        return reply.status(404).send({
          error: 'Agendamento não encontrado'
        })
      }
      
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })

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
  }, async (request, reply) => {
    try {
      const { id } = request.params
      const { notes } = request.body
      const booking = await prisma.booking.update({
        where: { id },
        data: { notes }
      })
      reply.send(booking)
    } catch (error) {
      reply.status(500).send({
        error: 'Erro ao atualizar motivo do cancelamento'
      })
    }
  })

  // Cancelar agendamento (cliente pode cancelar seus próprios)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { id } = request.params
      const user = request.user

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          client: true
        }
      })

      if (!booking) {
        return reply.status(404).send({
          error: 'Agendamento não encontrado'
        })
      }

      // Verificar permissão
      if (user.role === 'CLIENT' && booking.clientId !== user.id) {
        return reply.status(403).send({
          error: 'Acesso negado'
        })
      }

      // Só pode cancelar agendamentos pendentes ou confirmados
      if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
        return reply.status(400).send({
          error: 'Não é possível cancelar este agendamento'
        })
      }

      await prisma.booking.update({
        where: { id },
        data: { status: 'CANCELLED' }
      })

      reply.status(204).send()
    } catch (error) {
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })

  // Rotas de dias especiais (admin)
  fastify.get('/special-days', { preHandler: [fastify.adminAuth] }, async (request, reply) => {
    try {
      const days = await prisma.specialDay.findMany({ orderBy: [{ date: 'asc' }, { startTime: 'asc' }] })
      reply.send(days)
    } catch (error) {
      reply.status(500).send({ error: 'Erro ao buscar dias especiais' })
    }
  })

  fastify.post('/special-days', { preHandler: [fastify.adminAuth] }, async (request, reply) => {
    try {
      const { date, startTime, endTime } = request.body
      const day = await prisma.specialDay.create({ data: { date, startTime, endTime } })
      reply.status(201).send(day)
    } catch (error) {
      reply.status(500).send({ error: 'Erro ao criar dia especial' })
    }
  })

  fastify.put('/special-days/:id', { preHandler: [fastify.adminAuth] }, async (request, reply) => {
    try {
      const { id } = request.params
      const { date, startTime, endTime } = request.body
      const day = await prisma.specialDay.update({ where: { id }, data: { date, startTime, endTime } })
      reply.send(day)
    } catch (error) {
      reply.status(500).send({ error: 'Erro ao atualizar dia especial' })
    }
  })

  fastify.delete('/special-days/:id', { preHandler: [fastify.adminAuth] }, async (request, reply) => {
    try {
      const { id } = request.params
      await prisma.specialDay.delete({ where: { id } })
      reply.status(204).send()
    } catch (error) {
      reply.status(500).send({ error: 'Erro ao deletar dia especial' })
    }
  })

  // Ajustar endpoint de horários disponíveis para priorizar dias especiais
  fastify.get('/availability/:date', async (request, reply) => {
    try {
      const { date } = request.params
      const { serviceId } = request.query
      let serviceDuration = 0;
      if (serviceId) {
        const service = await prisma.service.findUnique({ where: { id: serviceId } });
        serviceDuration = service?.duration || 0;
      }
      // 1. Verifica se existe configuração especial para o dia
      const special = await prisma.specialDay.findMany({ where: { date }, orderBy: [{ startTime: 'asc' }] })
      let workingHours = [];
      if (special.length > 0) {
        workingHours = special.map(s => ({ startTime: s.startTime, endTime: s.endTime }))
      } else {
        const weekday = new Date(date).getDay();
        workingHours = await prisma.workingHour.findMany({ where: { weekday }, orderBy: [{ startTime: 'asc' }] })
      }
      // Gerar slots
      const timeSlots = [];
      for (const wh of workingHours) {
        let [h, m] = wh.startTime.split(':').map(Number);
        const [endH, endM] = wh.endTime.split(':').map(Number);
        while (h < endH || (h === endH && m < endM)) {
          const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          timeSlots.push(time);
          m += 30;
          if (m >= 60) { h++; m = 0; }
        }
      }
      // Buscar agendamentos para esta data (com duração do serviço)
      const bookings = await prisma.booking.findMany({
        where: {
          date,
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        },
        include: {
          service: { select: { duration: true } }
        }
      })
      // Marcar como ocupados todos os intervalos de cada agendamento
      const occupiedTimes = new Set();
      for (const b of bookings) {
        const duration = b.service?.duration || 0;
        let [h, m] = b.time.split(':').map(Number);
        const totalSteps = Math.ceil(duration / 30);
        for (let i = 0; i < totalSteps; i++) {
          const t = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          occupiedTimes.add(t);
          m += 30;
          if (m >= 60) { h++; m = 0; }
        }
      }
      // Para o serviço a ser agendado, bloquear slots que não encaixam a duração
      const availableSlots = timeSlots.map(time => {
        if (!serviceId || !serviceDuration) {
          return { time, available: !occupiedTimes.has(time) };
        }
        // Checar se todos os intervalos do serviço estão livres
        let [h, m] = time.split(':').map(Number);
        let canBook = true;
        for (let i = 0; i < Math.ceil(serviceDuration / 30); i++) {
          const t = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          if (!timeSlots.includes(t) || occupiedTimes.has(t)) {
            canBook = false;
            break;
          }
          m += 30;
          if (m >= 60) { h++; m = 0; }
        }
        return { time, available: canBook };
      });
      reply.send(availableSlots)
    } catch (error) {
      reply.status(500).send({ error: 'Erro interno do servidor' })
    }
  })

  // Estatísticas dos agendamentos (apenas admin)
  fastify.get('/stats/dashboard', {
    preHandler: [fastify.adminAuth]
  }, async (request, reply) => {
    try {
      const today = new Date().toISOString().split('T')[0]

      const [
        totalBookings,
        pendingBookings,
        completedBookings,
        todayBookings,
        completed
      ] = await Promise.all([
        prisma.booking.count(),
        prisma.booking.count({ where: { status: 'PENDING' } }),
        prisma.booking.count({ where: { status: 'COMPLETED' } }),
        prisma.booking.count({ where: { date: today } }),
        prisma.booking.findMany({
          where: { status: 'COMPLETED' },
          include: { service: { select: { price: true } } }
        })
      ]);
      const totalRevenue = completed.reduce((sum, b) => sum + (b.service?.price || 0), 0);

      reply.send({
        totalBookings,
        pendingBookings,
        completedBookings,
        todayBookings,
        totalRevenue
      })
    } catch (error) {
      reply.status(500).send({
        error: 'Erro interno do servidor'
      })
    }
  })

  // Rotas de horários de trabalho (admin)
  fastify.get('/working-hours', { preHandler: [fastify.adminAuth] }, async (request, reply) => {
    try {
      const hours = await prisma.workingHour.findMany({ orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }] })
      reply.send(hours)
    } catch (error) {
      reply.status(500).send({ error: 'Erro ao buscar horários' })
    }
  })

  fastify.post('/working-hours', { preHandler: [fastify.adminAuth] }, async (request, reply) => {
    try {
      const { weekday, startTime, endTime } = request.body
      const hour = await prisma.workingHour.create({ data: { weekday, startTime, endTime } })
      reply.status(201).send(hour)
    } catch (error) {
      reply.status(500).send({ error: 'Erro ao criar horário' })
    }
  })

  fastify.put('/working-hours/:id', { preHandler: [fastify.adminAuth] }, async (request, reply) => {
    try {
      const { id } = request.params
      const { weekday, startTime, endTime } = request.body
      const hour = await prisma.workingHour.update({ where: { id }, data: { weekday, startTime, endTime } })
      reply.send(hour)
    } catch (error) {
      reply.status(500).send({ error: 'Erro ao atualizar horário' })
    }
  })

  fastify.delete('/working-hours/:id', { preHandler: [fastify.adminAuth] }, async (request, reply) => {
    try {
      const { id } = request.params
      await prisma.workingHour.delete({ where: { id } })
      reply.status(204).send()
    } catch (error) {
      reply.status(500).send({ error: 'Erro ao deletar horário' })
    }
  })
} 