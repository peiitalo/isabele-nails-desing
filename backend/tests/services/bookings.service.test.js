import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as bookingsService from '../../src/services/bookings.service.js'
import * as bookingModel from '../../src/models/booking.model.js'
import * as serviceModel from '../../src/models/service.model.js'
import { AppError } from '../../src/errors/AppError.js'

vi.mock('../../src/models/booking.model.js')
vi.mock('../../src/models/service.model.js')

describe('Bookings Service (Unit Tests with Mocked Models)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listBookings', () => {
    it('deve restringir listagem ao clientId quando for CLIENT', async () => {
      vi.mocked(bookingModel.findManyBookings).mockResolvedValue([])

      await bookingsService.listBookings({ id: 'c1', role: 'CLIENT' })

      expect(bookingModel.findManyBookings).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clientId: 'c1' }
        })
      )
    })

    it('admin pode filtrar por clientId', async () => {
      vi.mocked(bookingModel.findManyBookings).mockResolvedValue([])

      await bookingsService.listBookings({ id: 'a1', role: 'ADMIN' }, { clientId: 'c2' })

      expect(bookingModel.findManyBookings).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clientId: 'c2' }
        })
      )
    })
  })

  describe('getBookingById', () => {
    it('deve lançar AppError 404 se agendamento não existir', async () => {
      vi.mocked(bookingModel.findBookingById).mockResolvedValue(null)

      await expect(bookingsService.getBookingById('b-none', { id: 'c1', role: 'CLIENT' }))
        .rejects.toMatchObject({ statusCode: 404, message: 'Agendamento não encontrado' })
    })

    it('deve lançar AppError 403 se CLIENT tentar visualizar agendamento de outro', async () => {
      vi.mocked(bookingModel.findBookingById).mockResolvedValue({ id: 'b1', clientId: 'c2' })

      await expect(bookingsService.getBookingById('b1', { id: 'c1', role: 'CLIENT' }))
        .rejects.toMatchObject({ statusCode: 403, message: 'Acesso negado' })
    })

    it('deve retornar agendamento se for do próprio CLIENT', async () => {
      const mockBooking = { id: 'b1', clientId: 'c1' }
      vi.mocked(bookingModel.findBookingById).mockResolvedValue(mockBooking)

      const result = await bookingsService.getBookingById('b1', { id: 'c1', role: 'CLIENT' })
      expect(result).toEqual(mockBooking)
    })
  })

  describe('createBooking', () => {
    it('deve lançar AppError 404 se serviço não existir', async () => {
      vi.mocked(serviceModel.findServiceById).mockResolvedValue(null)

      await expect(bookingsService.createBooking(
        { id: 'c1', role: 'CLIENT' },
        { serviceId: 's-none', date: '2026-04-06', time: '10:00' }
      )).rejects.toMatchObject({ statusCode: 404, message: 'Serviço não encontrado' })
    })

    it('deve lançar AppError 400 se serviço estiver inativo', async () => {
      vi.mocked(serviceModel.findServiceById).mockResolvedValue({ id: 's1', isActive: false })

      await expect(bookingsService.createBooking(
        { id: 'c1', role: 'CLIENT' },
        { serviceId: 's1', date: '2026-04-06', time: '10:00' }
      )).rejects.toMatchObject({ statusCode: 400, message: 'Serviço não está disponível' })
    })

    it('deve lançar AppError 400 se horário já estiver ocupado', async () => {
      vi.mocked(serviceModel.findServiceById).mockResolvedValue({ id: 's1', isActive: true })
      vi.mocked(bookingModel.findFirstBooking).mockResolvedValue({ id: 'b-exist' })

      await expect(bookingsService.createBooking(
        { id: 'c1', role: 'CLIENT' },
        { serviceId: 's1', date: '2026-04-06', time: '10:00' }
      )).rejects.toMatchObject({ statusCode: 400, message: 'Horário já está ocupado' })
    })

    it('deve criar agendamento PENDING por padrão para CLIENT', async () => {
      vi.mocked(serviceModel.findServiceById).mockResolvedValue({ id: 's1', isActive: true })
      vi.mocked(bookingModel.findFirstBooking).mockResolvedValue(null)
      vi.mocked(bookingModel.createBooking).mockResolvedValue({
        id: 'b-new',
        clientId: 'c1',
        serviceId: 's1',
        status: 'PENDING'
      })

      const result = await bookingsService.createBooking(
        { id: 'c1', role: 'CLIENT' },
        { serviceId: 's1', date: '2026-04-06', time: '10:00' }
      )

      expect(bookingModel.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clientId: 'c1',
            status: 'PENDING',
            createdBy: 'CLIENT'
          })
        })
      )
      expect(result.createdBy).toBe('CLIENT')
    })
  })

  describe('cancelBooking', () => {
    it('deve lançar AppError 404 se agendamento não existir', async () => {
      vi.mocked(bookingModel.findBookingById).mockResolvedValue(null)

      await expect(bookingsService.cancelBooking('b-none', { id: 'c1', role: 'CLIENT' }))
        .rejects.toMatchObject({ statusCode: 404, message: 'Agendamento não encontrado' })
    })

    it('deve lançar AppError 403 se cliente tentar cancelar agendamento de outro', async () => {
      vi.mocked(bookingModel.findBookingById).mockResolvedValue({ id: 'b1', clientId: 'c2', status: 'PENDING' })

      await expect(bookingsService.cancelBooking('b1', { id: 'c1', role: 'CLIENT' }))
        .rejects.toMatchObject({ statusCode: 403, message: 'Acesso negado' })
    })

    it('deve lançar AppError 403 se cliente tentar cancelar agendamento não pendente', async () => {
      vi.mocked(bookingModel.findBookingById).mockResolvedValue({ id: 'b1', clientId: 'c1', status: 'CONFIRMED' })

      await expect(bookingsService.cancelBooking('b1', { id: 'c1', role: 'CLIENT' }))
        .rejects.toMatchObject({ statusCode: 403, message: 'Só é possível cancelar agendamentos pendentes.' })
    })

    it('deve cancelar agendamento pendente com sucesso', async () => {
      vi.mocked(bookingModel.findBookingById).mockResolvedValue({ id: 'b1', clientId: 'c1', status: 'PENDING' })
      vi.mocked(bookingModel.updateBooking).mockResolvedValue({})

      await bookingsService.cancelBooking('b1', { id: 'c1', role: 'CLIENT' })
      expect(bookingModel.updateBooking).toHaveBeenCalledWith('b1', { data: { status: 'CANCELLED' } })
    })
  })

  describe('getDashboardStats', () => {
    it('deve agregar estatísticas de agendamentos e faturamento', async () => {
      vi.mocked(bookingModel.countBookings)
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3)  // pending
        .mockResolvedValueOnce(5)  // completed
        .mockResolvedValueOnce(2)  // today
      vi.mocked(bookingModel.findCompletedBookingsWithServicePrice).mockResolvedValue([
        { service: { price: 50 } },
        { service: { price: 150 } }
      ])

      const stats = await bookingsService.getDashboardStats()

      expect(stats).toEqual({
        totalBookings: 10,
        pendingBookings: 3,
        completedBookings: 5,
        todayBookings: 2,
        totalRevenue: 200
      })
    })
  })

  describe('Working Hours & Special Days CRUD', () => {
    it('deve delegar operações de horários de trabalho para o model', async () => {
      vi.mocked(bookingModel.findManyWorkingHours).mockResolvedValue([])
      vi.mocked(bookingModel.createWorkingHour).mockResolvedValue({ id: 'wh-1' })
      vi.mocked(bookingModel.updateWorkingHour).mockResolvedValue({ id: 'wh-1' })
      vi.mocked(bookingModel.deleteWorkingHour).mockResolvedValue({})

      await bookingsService.listWorkingHours()
      expect(bookingModel.findManyWorkingHours).toHaveBeenCalled()

      await bookingsService.createWorkingHour({ weekday: 1, startTime: '09:00', endTime: '18:00' })
      expect(bookingModel.createWorkingHour).toHaveBeenCalled()

      await bookingsService.updateWorkingHour('wh-1', { weekday: 1, startTime: '10:00', endTime: '18:00' })
      expect(bookingModel.updateWorkingHour).toHaveBeenCalled()

      await bookingsService.deleteWorkingHour('wh-1')
      expect(bookingModel.deleteWorkingHour).toHaveBeenCalledWith('wh-1')
    })

    it('deve delegar operações de dias especiais para o model', async () => {
      vi.mocked(bookingModel.findManySpecialDays).mockResolvedValue([])
      vi.mocked(bookingModel.createSpecialDay).mockResolvedValue({ id: 'sd-1' })
      vi.mocked(bookingModel.updateSpecialDay).mockResolvedValue({ id: 'sd-1' })
      vi.mocked(bookingModel.deleteSpecialDay).mockResolvedValue({})

      await bookingsService.listSpecialDays()
      expect(bookingModel.findManySpecialDays).toHaveBeenCalled()

      await bookingsService.createSpecialDay({ date: '2026-12-25', startTime: '09:00', endTime: '14:00' })
      expect(bookingModel.createSpecialDay).toHaveBeenCalled()

      await bookingsService.updateSpecialDay('sd-1', { date: '2026-12-25', startTime: '10:00', endTime: '15:00' })
      expect(bookingModel.updateSpecialDay).toHaveBeenCalled()

      await bookingsService.deleteSpecialDay('sd-1')
      expect(bookingModel.deleteSpecialDay).toHaveBeenCalledWith('sd-1')
    })
  })

  describe('getAvailability & Date Parsing', () => {
    it('deve extrair o dia da semana correto independente do fuso horário local', () => {
      // 2026-04-05 é Domingo (0)
      expect(bookingsService.getWeekdayFromDate('2026-04-05')).toBe(0)
      // 2026-04-06 é Segunda-feira (1)
      expect(bookingsService.getWeekdayFromDate('2026-04-06')).toBe(1)
      // Com sufixo ISO / horário
      expect(bookingsService.getWeekdayFromDate('2026-04-06T00:00:00.000Z')).toBe(1)
    })

    it('deve retornar lista vazia para data inválida', async () => {
      const slots = await bookingsService.getAvailability('')
      expect(slots).toEqual([])
    })

    it('deve gerar slots com base no horário de trabalho semanal', async () => {
      vi.mocked(bookingModel.findManySpecialDays).mockResolvedValue([])
      vi.mocked(bookingModel.findManyWorkingHours).mockResolvedValue([
        { weekday: 1, startTime: '09:00', endTime: '11:00' }
      ])
      vi.mocked(bookingModel.findManyBookings).mockResolvedValue([])

      const slots = await bookingsService.getAvailability('2026-04-06')

      expect(bookingModel.findManySpecialDays).toHaveBeenCalledWith({
        where: { date: '2026-04-06' },
        orderBy: [{ startTime: 'asc' }]
      })
      expect(bookingModel.findManyWorkingHours).toHaveBeenCalledWith({
        where: { weekday: 1 },
        orderBy: [{ startTime: 'asc' }]
      })
      // 09:00, 09:30, 10:00, 10:30 (4 slots)
      expect(slots.length).toBe(4)
      expect(slots[0]).toEqual({ time: '09:00', available: true })
      expect(slots[3]).toEqual({ time: '10:30', available: true })
    })

    it('deve priorizar dias especiais sobre o horário semanal', async () => {
      // Especial configurado para 14:00 - 16:00
      vi.mocked(bookingModel.findManySpecialDays).mockResolvedValue([
        { date: '2026-04-06', startTime: '14:00', endTime: '16:00' }
      ])
      vi.mocked(bookingModel.findManyBookings).mockResolvedValue([])

      const slots = await bookingsService.getAvailability('2026-04-06')

      // Não deve buscar working hours normais
      expect(bookingModel.findManyWorkingHours).not.toHaveBeenCalled()
      // 14:00, 14:30, 15:00, 15:30 (4 slots)
      expect(slots.length).toBe(4)
      expect(slots[0].time).toBe('14:00')
      expect(slots[3].time).toBe('15:30')
    })

    it('deve subtrair agendamentos existentes (PENDING ou CONFIRMED)', async () => {
      vi.mocked(bookingModel.findManySpecialDays).mockResolvedValue([])
      vi.mocked(bookingModel.findManyWorkingHours).mockResolvedValue([
        { weekday: 1, startTime: '09:00', endTime: '11:00' }
      ])
      vi.mocked(bookingModel.findManyBookings).mockResolvedValue([
        { time: '09:30', service: { duration: 30 } }
      ])

      const slots = await bookingsService.getAvailability('2026-04-06')

      expect(slots.find(s => s.time === '09:00').available).toBe(true)
      expect(slots.find(s => s.time === '09:30').available).toBe(false)
      expect(slots.find(s => s.time === '10:00').available).toBe(true)
    })

    it('deve considerar duração do serviço para bloquear slots que ultrapassam o expediente', async () => {
      vi.mocked(bookingModel.findManySpecialDays).mockResolvedValue([])
      vi.mocked(bookingModel.findManyWorkingHours).mockResolvedValue([
        { weekday: 1, startTime: '09:00', endTime: '11:00' }
      ])
      vi.mocked(serviceModel.findServiceById).mockResolvedValue({ id: 's1', duration: 60 })
      vi.mocked(bookingModel.findManyBookings).mockResolvedValue([])

      const slots = await bookingsService.getAvailability('2026-04-06', 's1')

      // 09:00 (ocupa 09:00 e 09:30) -> livre
      expect(slots.find(s => s.time === '09:00').available).toBe(true)
      // 09:30 (ocupa 09:30 e 10:00) -> livre
      expect(slots.find(s => s.time === '09:30').available).toBe(true)
      // 10:00 (ocupa 10:00 e 10:30) -> livre
      expect(slots.find(s => s.time === '10:00').available).toBe(true)
      // 10:30 (precisaria de 10:30 e 11:00, mas fecha às 11:00) -> indisponível
      expect(slots.find(s => s.time === '10:30').available).toBe(false)
    })
  })
})
