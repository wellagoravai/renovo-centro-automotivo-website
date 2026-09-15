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

  it('exibe o nome do cliente somente leitura na tela de detalhes da OS', async () => {
    render(
      <MemoryRouter initialEntries={['/service-orders/os-1']}>
        <Routes>
          <Route path="/service-orders/:id" element={<ServiceOrderDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getAllByText('João da Silva').length).toBeGreaterThan(0));

    expect(screen.queryByRole('button', { name: /salvar cliente/i })).not.toBeInTheDocument();
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

  // Regressão: uma OS de Guincho carrega o bloco "Dados do Guincho" (com a
  // cotação de frete rodoviário) na aba padrão — precisa renderizar sem quebrar
  // mesmo quando towDetails vem com os campos novos de origem/destino/pedágio.
  it('renderiza a seção de guincho e a cotação de frete para uma OS do tipo Guincho', async () => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/service-orders/')) {
        if (url.includes('/photos')) {
          return Promise.resolve({ ok: true, json: async () => [] });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'os-2',
            number: '20260901',
            status: 'Chamado recebido',
            serviceType: 'Guincho',
            customerName: 'Carlos Souza',
            vehiclePlate: 'XYZ9A87',
            vehicleBrand: 'Fiat',
            vehicleModel: 'Uno',
            vehicleColor: 'Branco',
            vehicleYear: 2018,
            vehicleMileage: 50000,
            problemReported: 'Pane seca',
            diagnosis: '',
            services: '',
            estimatedTime: 0,
            laborValue: 0,
            notes: '',
            entryDate: '2026-09-01T00:00:00.000Z',
            estimatedDate: null,
            finalDate: null,
            photos: '',
            responsibleUser: 'Recepção',
            assignedUserId: '',
            assignedUserName: '',
            hasChecklist: false,
            vehicleId: 'veh-2',
            towDetails: {
              insuranceCompany: '', assistanceCompany: '', claimNumber: '',
              pickupLocation: 'Rua A, 100', deliveryDestination: 'Rua B, 200', towUnit: '',
              deliveredByName: '', deliveredByDocument: '', receivedByName: '', receivedByDocument: '',
              originCity: 'Uberlândia', originState: 'MG',
              destinationCity: 'São Paulo', destinationState: 'SP',
              pricePerKm: 4.5, axleCount: 2, distanceKm: 100, tollsValue: 30, freightTotal: 480,
            },
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

    render(
      <MemoryRouter initialEntries={['/service-orders/os-2']}>
        <Routes>
          <Route path="/service-orders/:id" element={<ServiceOrderDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Dados do Guincho')).toBeInTheDocument();
    expect(screen.getByText('Cotação de Frete Rodoviário')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Rua A, 100')).toBeInTheDocument();
  });
});
