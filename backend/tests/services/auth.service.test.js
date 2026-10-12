import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as authService from '../../src/services/auth.service.js'
import * as authModel from '../../src/models/auth.model.js'
import bcrypt from 'bcryptjs'
import { AppError } from '../../src/errors/AppError.js'

vi.mock('../../src/models/auth.model.js')
vi.mock('bcryptjs')

describe('Auth Service (Unit Tests with Mocked Model)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loginUser', () => {
    it('deve lançar AppError 401 se usuário não for encontrado', async () => {
      vi.mocked(authModel.findUserByEmail).mockResolvedValue(null)

      await expect(authService.loginUser('naoexiste@test.com', 'senha123'))
        .rejects.toThrow(AppError)
      await expect(authService.loginUser('naoexiste@test.com', 'senha123'))
        .rejects.toMatchObject({ statusCode: 401, message: 'Email ou senha incorretos' })
    })

    it('deve lançar AppError 401 se senha estiver incorreta', async () => {
      vi.mocked(authModel.findUserByEmail).mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        password: 'hashedPassword'
      })
      vi.mocked(bcrypt.compare).mockResolvedValue(false)

      await expect(authService.loginUser('user@test.com', 'senhaErrada'))
        .rejects.toMatchObject({ statusCode: 401, message: 'Email ou senha incorretos' })
    })

    it('deve retornar dados do usuário sem o campo password quando credenciais forem válidas', async () => {
      vi.mocked(authModel.findUserByEmail).mockResolvedValue({
        id: 'user-1',
        name: 'User Test',
        email: 'user@test.com',
        role: 'CLIENT',
        password: 'hashedPassword'
      })
      vi.mocked(bcrypt.compare).mockResolvedValue(true)

      const result = await authService.loginUser('user@test.com', 'senhaCerta')

      expect(result).toEqual({
        user: {
          id: 'user-1',
          name: 'User Test',
          email: 'user@test.com',
          role: 'CLIENT'
        }
      })
      expect(result.user.password).toBeUndefined()
    })
  })

  describe('registerUser', () => {
    it('deve lançar AppError 400 se email já estiver em uso', async () => {
      vi.mocked(authModel.findUserByEmail).mockResolvedValue({ id: 'existing' })

      await expect(authService.registerUser({
        name: 'Novo',
        email: 'jaexiste@test.com',
        phone: '11999999999',
        password: 'SenhaForte1!'
      })).rejects.toMatchObject({ statusCode: 400, message: 'Email já cadastrado' })
    })

    it('deve hashear a senha e criar novo cliente', async () => {
      vi.mocked(authModel.findUserByEmail).mockResolvedValue(null)
      vi.mocked(bcrypt.hash).mockResolvedValue('newHashedPassword')
      vi.mocked(authModel.createUser).mockResolvedValue({
        id: 'user-new',
        name: 'Novo',
        email: 'novo@test.com',
        phone: '11999999999',
        role: 'CLIENT',
        password: 'newHashedPassword'
      })

      const result = await authService.registerUser({
        name: 'Novo',
        email: 'novo@test.com',
        phone: '11999999999',
        password: 'SenhaForte1!'
      })

      expect(bcrypt.hash).toHaveBeenCalledWith('SenhaForte1!', 10)
      expect(authModel.createUser).toHaveBeenCalledWith({
        name: 'Novo',
        email: 'novo@test.com',
        phone: '11999999999',
        password: 'newHashedPassword',
        role: 'CLIENT'
      })
      expect(result.user).toEqual({
        id: 'user-new',
        name: 'Novo',
        email: 'novo@test.com',
        phone: '11999999999',
        role: 'CLIENT'
      })
      expect(result.user.password).toBeUndefined()
    })
  })

  describe('getMe', () => {
    it('deve lançar AppError 404 se usuário não existir', async () => {
      vi.mocked(authModel.findUserById).mockResolvedValue(null)

      await expect(authService.getMe('invalid-id'))
        .rejects.toMatchObject({ statusCode: 404, message: 'Usuário não encontrado' })
    })

    it('deve retornar os dados do perfil quando usuário existir', async () => {
      const mockProfile = {
        id: 'user-1',
        name: 'Isa',
        email: 'isa@test.com',
        phone: '11988888888',
        role: 'ADMIN',
        createdAt: new Date()
      }
      vi.mocked(authModel.findUserById).mockResolvedValue(mockProfile)

      const user = await authService.getMe('user-1')
      expect(user).toEqual(mockProfile)
    })
  })
})
