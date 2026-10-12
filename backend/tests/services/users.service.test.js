import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as usersService from '../../src/services/users.service.js'
import * as userModel from '../../src/models/user.model.js'
import * as bookingModel from '../../src/models/booking.model.js'
import bcrypt from 'bcryptjs'
import { AppError } from '../../src/errors/AppError.js'

vi.mock('../../src/models/user.model.js')
vi.mock('../../src/models/booking.model.js')
vi.mock('bcryptjs')

describe('Users Service (Unit Tests with Mocked Models)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listUsers', () => {
    it('deve chamar userModel.findManyUsers com os filtros corretos', async () => {
      const mockUsers = [{ id: '1', name: 'Ana' }]
      vi.mocked(userModel.findManyUsers).mockResolvedValue(mockUsers)

      const result = await usersService.listUsers({ role: 'CLIENT', search: 'Ana' })

      expect(userModel.findManyUsers).toHaveBeenCalledWith({
        where: {
          role: 'CLIENT',
          OR: [
            { name: { contains: 'Ana', mode: 'insensitive' } },
            { email: { contains: 'Ana', mode: 'insensitive' } },
            { phone: { contains: 'Ana' } }
          ]
        },
        select: expect.any(Object),
        orderBy: { name: 'asc' }
      })
      expect(result).toEqual(mockUsers)
    })
  })

  describe('getUserById', () => {
    it('deve lançar AppError 403 se cliente tentar acessar dados de outro usuário', async () => {
      await expect(usersService.getUserById('user-2', { id: 'user-1', role: 'CLIENT' }))
        .rejects.toMatchObject({ statusCode: 403, message: 'Acesso negado' })
    })

    it('deve lançar AppError 404 se usuário não for encontrado', async () => {
      vi.mocked(userModel.findUserById).mockResolvedValue(null)

      await expect(usersService.getUserById('user-1', { id: 'user-1', role: 'CLIENT' }))
        .rejects.toMatchObject({ statusCode: 404, message: 'Usuário não encontrado' })
    })

    it('deve retornar dados do usuário se admin ou próprio usuário', async () => {
      const mockUser = { id: 'user-2', name: 'Target' }
      vi.mocked(userModel.findUserById).mockResolvedValue(mockUser)

      const result = await usersService.getUserById('user-2', { id: 'admin-1', role: 'ADMIN' })
      expect(result).toEqual(mockUser)
    })
  })

  describe('updateUser', () => {
    it('deve lançar AppError 403 se cliente tentar atualizar outro usuário', async () => {
      await expect(usersService.updateUser('user-2', { name: 'Novo' }, { id: 'user-1', role: 'CLIENT' }))
        .rejects.toMatchObject({ statusCode: 403, message: 'Acesso negado' })
    })

    it('deve lançar AppError 400 se novo email já estiver em uso', async () => {
      vi.mocked(userModel.findFirstUser).mockResolvedValue({ id: 'user-3', email: 'taken@test.com' })

      await expect(usersService.updateUser('user-1', { email: 'taken@test.com' }, { id: 'user-1', role: 'CLIENT' }))
        .rejects.toMatchObject({ statusCode: 400, message: 'Email já está em uso' })
    })

    it('deve mapear erro P2025 para AppError 404', async () => {
      vi.mocked(userModel.findFirstUser).mockResolvedValue(null)
      const p2025Error = new Error('Not found')
      p2025Error.code = 'P2025'
      vi.mocked(userModel.updateUser).mockRejectedValue(p2025Error)

      await expect(usersService.updateUser('user-1', { name: 'Nome' }, { id: 'user-1', role: 'CLIENT' }))
        .rejects.toMatchObject({ statusCode: 404, message: 'Usuário não encontrado' })
    })
  })

  describe('changePassword', () => {
    it('deve lançar AppError 403 se tentar alterar senha de outro usuário', async () => {
      await expect(usersService.changePassword('user-2', { currentPassword: '1', newPassword: '2' }, { id: 'user-1', role: 'CLIENT' }))
        .rejects.toMatchObject({ statusCode: 403, message: 'Acesso negado' })
    })

    it('deve lançar AppError 404 se usuário não existir', async () => {
      vi.mocked(userModel.findUserById).mockResolvedValue(null)

      await expect(usersService.changePassword('user-1', { currentPassword: '1', newPassword: '2' }, { id: 'user-1', role: 'CLIENT' }))
        .rejects.toMatchObject({ statusCode: 404, message: 'Usuário não encontrado' })
    })

    it('deve lançar AppError 400 se senha atual for incorreta', async () => {
      vi.mocked(userModel.findUserById).mockResolvedValue({ id: 'user-1', password: 'hashed' })
      vi.mocked(bcrypt.compare).mockResolvedValue(false)

      await expect(usersService.changePassword('user-1', { currentPassword: 'wrong', newPassword: '2' }, { id: 'user-1', role: 'CLIENT' }))
        .rejects.toMatchObject({ statusCode: 400, message: 'Senha atual incorreta' })
    })

    it('deve atualizar senha com sucesso quando credenciais forem válidas', async () => {
      vi.mocked(userModel.findUserById).mockResolvedValue({ id: 'user-1', password: 'hashed' })
      vi.mocked(bcrypt.compare).mockResolvedValue(true)
      vi.mocked(bcrypt.hash).mockResolvedValue('newHashed')
      vi.mocked(userModel.updateUser).mockResolvedValue({})

      await usersService.changePassword('user-1', { currentPassword: 'correct', newPassword: 'new' }, { id: 'user-1', role: 'CLIENT' })

      expect(userModel.updateUser).toHaveBeenCalledWith('user-1', { password: 'newHashed' })
    })
  })

  describe('deleteUser', () => {
    it('deve lançar AppError 400 se usuário possuir agendamentos', async () => {
      vi.mocked(bookingModel.findBookingsByClientId).mockResolvedValue([{ id: 'b1' }])

      await expect(usersService.deleteUser('user-1'))
        .rejects.toMatchObject({ statusCode: 400, message: 'Não é possível deletar um usuário que possui agendamentos' })
    })

    it('deve mapear erro P2025 para AppError 404', async () => {
      vi.mocked(bookingModel.findBookingsByClientId).mockResolvedValue([])
      const p2025Error = new Error('Not found')
      p2025Error.code = 'P2025'
      vi.mocked(userModel.deleteUser).mockRejectedValue(p2025Error)

      await expect(usersService.deleteUser('user-nonexistent'))
        .rejects.toMatchObject({ statusCode: 404, message: 'Usuário não encontrado' })
    })

    it('deve deletar usuário quando não houver agendamentos', async () => {
      vi.mocked(bookingModel.findBookingsByClientId).mockResolvedValue([])
      vi.mocked(userModel.deleteUser).mockResolvedValue({})

      await usersService.deleteUser('user-1')
      expect(userModel.deleteUser).toHaveBeenCalledWith('user-1')
    })
  })

  describe('getUsersStats', () => {
    it('deve agregar estatísticas de usuários e receita', async () => {
      vi.mocked(userModel.countUsers)
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8)  // clients
        .mockResolvedValueOnce(2)  // admins
        .mockResolvedValueOnce(5)  // active
      vi.mocked(bookingModel.findCompletedBookingsWithServicePrice).mockResolvedValue([
        { service: { price: 50 } },
        { service: { price: 70 } }
      ])

      const stats = await usersService.getUsersStats()

      expect(stats).toEqual({
        totalUsers: 10,
        totalClients: 8,
        totalAdmins: 2,
        activeClients: 5,
        totalRevenue: 120
      })
    })
  })
})
