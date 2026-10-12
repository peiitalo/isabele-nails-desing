import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as servicesService from '../../src/services/services.service.js'
import * as serviceModel from '../../src/models/service.model.js'
import * as bookingModel from '../../src/models/booking.model.js'
import { AppError } from '../../src/errors/AppError.js'

vi.mock('../../src/models/service.model.js')
vi.mock('../../src/models/booking.model.js')

describe('Services Service (Unit Tests with Mocked Models)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listServices', () => {
    it('deve chamar serviceModel.findManyServices com filtros corretos', async () => {
      vi.mocked(serviceModel.findManyServices).mockResolvedValue([])

      await servicesService.listServices({ category: 'MANICURE', isActive: 'true' })

      expect(serviceModel.findManyServices).toHaveBeenCalledWith({
        where: { category: 'MANICURE', isActive: true },
        orderBy: { name: 'asc' }
      })
    })
  })

  describe('getServiceById', () => {
    it('deve lançar AppError 404 se serviço não existir', async () => {
      vi.mocked(serviceModel.findServiceById).mockResolvedValue(null)

      await expect(servicesService.getServiceById('s-none'))
        .rejects.toMatchObject({ statusCode: 404, message: 'Serviço não encontrado' })
    })

    it('deve retornar o serviço quando encontrado', async () => {
      const mockService = { id: 's-1', name: 'Manicure' }
      vi.mocked(serviceModel.findServiceById).mockResolvedValue(mockService)

      const result = await servicesService.getServiceById('s-1')
      expect(result).toEqual(mockService)
    })
  })

  describe('createService', () => {
    it('deve chamar serviceModel.createService com os dados fornecidos', async () => {
      const newServiceData = { name: 'Pedicure', price: 60 }
      vi.mocked(serviceModel.createService).mockResolvedValue({ id: 's-2', ...newServiceData })

      const result = await servicesService.createService(newServiceData)
      expect(serviceModel.createService).toHaveBeenCalledWith(newServiceData)
      expect(result.id).toBe('s-2')
    })
  })

  describe('updateService', () => {
    it('deve mapear erro P2025 para AppError 404', async () => {
      const p2025 = new Error('Not found')
      p2025.code = 'P2025'
      vi.mocked(serviceModel.updateService).mockRejectedValue(p2025)

      await expect(servicesService.updateService('s-none', { price: 80 }))
        .rejects.toMatchObject({ statusCode: 404, message: 'Serviço não encontrado' })
    })

    it('deve atualizar o serviço com sucesso', async () => {
      const updated = { id: 's-1', name: 'Novo Nome' }
      vi.mocked(serviceModel.updateService).mockResolvedValue(updated)

      const result = await servicesService.updateService('s-1', { name: 'Novo Nome' })
      expect(result).toEqual(updated)
    })
  })

  describe('deleteService', () => {
    it('deve mapear erro P2025 para AppError 404', async () => {
      const p2025 = new Error('Not found')
      p2025.code = 'P2025'
      vi.mocked(serviceModel.deleteService).mockRejectedValue(p2025)

      await expect(servicesService.deleteService('s-none'))
        .rejects.toMatchObject({ statusCode: 404, message: 'Serviço não encontrado' })
    })

    it('deve deletar serviço com sucesso', async () => {
      vi.mocked(serviceModel.deleteService).mockResolvedValue({})

      await servicesService.deleteService('s-1')
      expect(serviceModel.deleteService).toHaveBeenCalledWith('s-1')
    })
  })

  describe('getServicesStats', () => {
    it('deve retornar agregados de serviços e receita', async () => {
      vi.mocked(serviceModel.countServices)
        .mockResolvedValueOnce(5) // total
        .mockResolvedValueOnce(4) // active
      vi.mocked(serviceModel.groupServicesByCategory).mockResolvedValue([
        { category: 'MANICURE', _count: { category: 3 } }
      ])
      vi.mocked(bookingModel.findCompletedBookingsWithServicePrice).mockResolvedValue([
        { service: { price: 50 } },
        { service: { price: 100 } }
      ])

      const stats = await servicesService.getServicesStats()

      expect(stats).toEqual({
        totalServices: 5,
        activeServices: 4,
        servicesByCategory: [{ category: 'MANICURE', _count: { category: 3 } }],
        totalRevenue: 150
      })
    })
  })
})
