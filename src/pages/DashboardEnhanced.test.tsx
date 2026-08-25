import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardEnhanced from './DashboardEnhanced';
import { api } from '../services/api';

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { fullName: 'Administrador' },
  }),
}));

jest.mock('../services/api', () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
  },
}));

describe('DashboardEnhanced', () => {
  beforeEach(() => {
    (api.get as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'os-1',
          number: '20260628',
          status: 'Recebido',
          customerName: 'João da Silva',
          vehicleInfo: 'Civic 2020',
          entryDate: '2026-08-24T00:00:00.000Z',
          problemReported: 'Suspensão',
        },
      ],
    });
    (api.patch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    (api.put as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  it('permite alterar o nome do cliente no modal de atualização de status', async () => {
    render(
      <MemoryRouter>
        <DashboardEnhanced />
      </MemoryRouter>
    );

    await waitFor(() => expect(api.get).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /atualizar/i }));

    const clienteInput = screen.getByDisplayValue('João da Silva');
    expect(clienteInput).not.toBeDisabled();

    fireEvent.change(clienteInput, { target: { value: 'Maria da Silva' } });
    expect(clienteInput).toHaveValue('Maria da Silva');

    fireEvent.click(screen.getByRole('button', { name: /atualizar status/i }));

    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/service-orders/os-1', {
      customerName: 'Maria da Silva',
    }));
  });
});
