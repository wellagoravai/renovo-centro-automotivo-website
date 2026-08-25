import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Inventory from './Inventory';
import { api } from '../services/api';

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    hasPermission: () => true,
  }),
}));

jest.mock('../services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Inventory', () => {
  beforeEach(() => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/Inventory/categories') {
        return Promise.resolve({ json: async () => ['Pneus'] });
      }
      return Promise.resolve({ json: async () => [] });
    });
  });

  it('calcula o valor de venda automaticamente com custo e margem percentual', async () => {
    render(<Inventory />);

    await waitFor(() => expect(screen.getByText('+ Novo Item')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /\+ novo item/i }));

    fireEvent.change(screen.getByLabelText('Código *'), { target: { value: 'P001' } });
    fireEvent.change(screen.getByLabelText('Descrição *'), { target: { value: 'Pneu' } });
    fireEvent.change(screen.getByLabelText('Categoria *'), { target: { value: 'Pneus' } });
    fireEvent.change(screen.getByLabelText('Marca *'), { target: { value: 'Michelin' } });
    fireEvent.change(screen.getByLabelText('Quantidade *'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Quantidade Mínima *'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Valor de Compra (R$) *'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Margem (%) *'), { target: { value: '25' } });

    expect(screen.getByLabelText('Valor de Venda (R$) *')).toHaveValue(125);
  });
});
