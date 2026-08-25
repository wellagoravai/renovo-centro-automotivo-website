import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ServiceOrderDetails from './ServiceOrderDetails';
import { api } from '../services/api';

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { fullName: 'Administrador', role: 'Administrador' },
  }),
}));

jest.mock('../services/api', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('ServiceOrderDetails', () => {
  beforeEach(() => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/service-orders/')) {
        if (url.includes('/photos')) {
          return Promise.resolve({ ok: true, json: async () => [] });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'os-1',
            number: '20260628',
            status: 'Recebido',
            serviceType: 'Oficina',
            customerName: 'João da Silva',
            vehiclePlate: 'ABC-1234',
            vehicleBrand: 'Honda',
            vehicleModel: 'Civic',
            vehicleColor: 'Prata',
            vehicleYear: 2020,
            vehicleMileage: 12000,
            problemReported: 'Suspensão',
            diagnosis: '',
            services: '',
            estimatedTime: 0,
            laborValue: 0,
            notes: '',
            entryDate: '2026-08-24T00:00:00.000Z',
            estimatedDate: null,
            finalDate: null,
            photos: '',
            responsibleUser: 'Mecânico',
            assignedUserId: '',
            assignedUserName: '',
            hasChecklist: false,
            vehicleId: 'veh-1',
            towDetails: null,
            history: [],
            items: [],
            value: 0,
          }),
        });
      }
      if (url.includes('/Users/assignable')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    (api.put as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        customerName: 'Maria da Silva',
      }),
    });
  });

  it('permite alterar o nome do cliente na tela de detalhes da OS', async () => {
    render(
      <MemoryRouter initialEntries={['/service-orders/os-1']}>
        <Routes>
          <Route path="/service-orders/:id" element={<ServiceOrderDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getAllByDisplayValue('João da Silva').length).toBeGreaterThan(0));

    const customerInput = screen.getAllByDisplayValue('João da Silva')[0];
    fireEvent.change(customerInput, { target: { value: 'Maria da Silva' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar cliente/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/service-orders/os-1', {
        customerName: 'Maria da Silva',
      });
    });
  });

  it('exibe edição dos dados do check-in para administrador', async () => {
    render(
      <MemoryRouter initialEntries={['/service-orders/os-1']}>
        <Routes>
          <Route path="/service-orders/:id" element={<ServiceOrderDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByDisplayValue('ABC-1234')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /salvar dados do check-in/i })).toBeInTheDocument();
  });
});
