import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Booking from './Booking';
import { AuthProvider } from '../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    getServices: jest.fn().mockResolvedValue([
      { id: '1', name: 'Manicure', price: 30, duration: 60, description: 'Manicure completa' },
      { id: '2', name: 'Pedicure', price: 40, duration: 60, description: 'Pedicure completa' },
    ]),
    getAvailableSlots: jest.fn().mockResolvedValue([
      { time: '09:00', available: true },
      { time: '10:00', available: false },
      { time: '11:00', available: true },
    ]),
    createBooking: jest.fn().mockResolvedValue({}),
  }
}));

describe('Booking (Cliente)', () => {
  it('deve permitir selecionar serviço, data, horário e enviar agendamento', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Booking />
        </BrowserRouter>
      </AuthProvider>
    );

    // Espera carregar serviços
    expect(await screen.findByText('Manicure')).toBeInTheDocument();

    // Seleciona serviço
    fireEvent.click(screen.getByText('Manicure'));
    // Seleciona data (primeira disponível)
    const dateButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('1'));
    fireEvent.click(dateButton!);

    // Espera horários carregarem
    await waitFor(() => expect(screen.getByText('09:00')).toBeInTheDocument());
    // Seleciona horário disponível
    fireEvent.click(screen.getByText('09:00'));

    // Preenche observação
    fireEvent.change(screen.getByPlaceholderText(/preferência/i), { target: { value: 'Quero esmalte rosa' } });

    // Envia formulário
    fireEvent.click(screen.getByText(/Confirmar Agendamento/i));

    // Espera feedback de sucesso
    await waitFor(() => expect(screen.getByText(/Agendamento realizado com sucesso/i)).toBeInTheDocument());
  });
}); 