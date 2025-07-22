import prisma from './client.js'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Limpar dados existentes
  await prisma.booking.deleteMany()
  await prisma.service.deleteMany()
  await prisma.user.deleteMany()

  // Criar usuários
  const adminPassword = await bcrypt.hash('admin123', 10)
  const clientPassword = await bcrypt.hash('cliente123', 10)

  const admin = await prisma.user.create({
    data: {
      name: 'Isabela',
      email: 'admin@isa.com',
      phone: '(11) 99999-9999',
      password: adminPassword,
      role: 'ADMIN'
    }
  })

  const client = await prisma.user.create({
    data: {
      name: 'Maria Silva',
      email: 'cliente@teste.com',
      phone: '(11) 88888-8888',
      password: clientPassword,
      role: 'CLIENT'
    }
  })

  // Criar serviços
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Manicure Completa',
        description: 'Cutilagem, lixamento, hidratação e esmaltação',
        price: 35.00,
        duration: 60,
        category: 'MANICURE'
      }
    }),
    prisma.service.create({
      data: {
        name: 'Pedicure Completa',
        description: 'Cutilagem, lixamento, hidratação e esmaltação',
        price: 40.00,
        duration: 75,
        category: 'PEDICURE'
      }
    }),
    prisma.service.create({
      data: {
        name: 'Esmaltação em Gel',
        description: 'Aplicação de esmalte em gel com secagem',
        price: 45.00,
        duration: 45,
        category: 'ESMALTACAO'
      }
    }),
    prisma.service.create({
      data: {
        name: 'Decoração Simples',
        description: 'Aplicação de decorações simples nas unhas',
        price: 15.00,
        duration: 30,
        category: 'DECORACAO'
      }
    }),
    prisma.service.create({
      data: {
        name: 'Decoração Avançada',
        description: 'Decorações complexas com pedras e desenhos',
        price: 25.00,
        duration: 45,
        category: 'DECORACAO'
      }
    }),
    prisma.service.create({
      data: {
        name: 'Manicure + Pedicure',
        description: 'Pacote completo de manicure e pedicure',
        price: 65.00,
        duration: 120,
        category: 'MANICURE'
      }
    })
  ])

  // Criar alguns agendamentos de exemplo
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  await Promise.all([
    prisma.booking.create({
      data: {
        clientId: client.id,
        serviceId: services[0].id, // Manicure Completa
        date: today.toISOString().split('T')[0],
        time: '14:00',
        status: 'CONFIRMED',
        notes: 'Preferência por esmalte rosa'
      }
    }),
    prisma.booking.create({
      data: {
        clientId: client.id,
        serviceId: services[2].id, // Esmaltação em Gel
        date: tomorrow.toISOString().split('T')[0],
        time: '16:00',
        status: 'PENDING'
      }
    })
  ])

  console.log('✅ Seed concluído com sucesso!')
  console.log(`👤 Admin criado: ${admin.email}`)
  console.log(`👤 Cliente criado: ${client.email}`)
  console.log(`💅 ${services.length} serviços criados`)
  console.log(`📅 2 agendamentos de exemplo criados`)
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 