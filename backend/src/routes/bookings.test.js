import Fastify from 'fastify';
import bookingRoutes from './bookings.js';
import serviceRoutes from './services.js';
import prisma from '../database/client.js';
import supertest from 'supertest';

let fastify;

beforeAll(async () => {
  fastify = Fastify();
  await fastify.register(serviceRoutes, { prefix: '/api/services' });
  await fastify.register(bookingRoutes, { prefix: '/api/bookings' });
  await fastify.ready();
});

afterAll(async () => {
  await fastify.close();
});

describe('GET /api/bookings/availability/:date', () => {
  it('bloqueia o intervalo do serviço escolhido', async () => {
    // Cria serviço de 90 minutos
    const service = await prisma.service.create({
      data: {
        name: 'Teste Longo',
        description: 'Serviço longo',
        price: 100,
        duration: 90,
        category: 'MANICURE',
        isActive: true
      }
    });
    // Cria agendamento das 10:00
    await prisma.booking.create({
      data: {
        clientId: 'test-client',
        serviceId: service.id,
        date: '2099-01-01',
        time: '10:00',
        status: 'CONFIRMED'
      }
    });
    // Consulta horários disponíveis para o mesmo serviço
    const res = await supertest(fastify.server)
      .get(`/api/bookings/availability/2099-01-01?serviceId=${service.id}`)
      .expect(200);
    // 10:00, 10:30 e 11:00 devem estar ocupados
    const slot10 = res.body.find(s => s.time === '10:00');
    const slot1030 = res.body.find(s => s.time === '10:30');
    const slot11 = res.body.find(s => s.time === '11:00');
    expect(slot10.available).toBe(false);
    expect(slot1030.available).toBe(false);
    expect(slot11.available).toBe(false);
    // 11:30 deve estar disponível
    const slot1130 = res.body.find(s => s.time === '11:30');
    expect(slot1130.available).toBe(true);
  });
}); 