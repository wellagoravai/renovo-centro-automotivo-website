import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import NewServiceOrderMobile from './NewServiceOrderMobile';
import { api } from '../services/api';

jest.mock('../services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const FIPE_MARCAS = [{ codigo: '21', nome: 'Toyota' }, { codigo: '59', nome: 'Volkswagen' }];
const FIPE_MODELOS_TOYOTA = { modelos: [{ codigo: 1, nome: 'Corolla' }, { codigo: 2, nome: 'Hilux' }] };

function mockFetchResponses() {
  global.fetch = jest.fn((url: RequestInfo | URL) => {
    const href = url.toString();
    if (href.includes('fipe/api/v1/carros/marcas/')) {
      return Promise.resolve({ json: async () => FIPE_MODELOS_TOYOTA } as Response);
    }
    if (href.includes('fipe/api/v1/carros/marcas')) {
      return Promise.resolve({ json: async () => FIPE_MARCAS } as Response);
    }
    if (href.includes('servicodados.ibge.gov.br')) {
      return Promise.resolve({ json: async () => [{ nome: 'Uberlândia' }, { nome: 'Belo Horizonte' }] } as Response);
    }
    return Promise.resolve({ json: async () => ([]) } as Response);
  }) as jest.Mock;
}

// Existem duas barras de ação (topo e rodapé) que renderizam o mesmo botão
// "Próximo →" simultaneamente — sempre clica na primeira ocorrência.
function clickProximo() {
  fireEvent.click(screen.getAllByRole('button', { name: /próximo/i })[0]);
}

async function goToVehicleStep() {
  fireEvent.change(screen.getByPlaceholderText('000.000.000-00'), { target: { value: '529.982.247-25' } });
  clickProximo();
  await screen.findByText('Dados do Veículo');
}

describe('NewServiceOrderMobile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchResponses();
    window.alert = jest.fn();
  });

  // Regressão: a busca de marca/modelo por FIPE foi adicionada referenciando
  // `vehicle.brand` num `const` de nível superior do componente, declarado ANTES
  // do `useState` de `vehicle` mais abaixo no arquivo — isso derruba a tela inteira
  // com "ReferenceError: Cannot access 'vehicle' before initialization" assim que
  // o componente monta, mesmo sem nenhuma interação do usuário.
  it('renderiza a tela sem lançar erro (regressão: TDZ no acesso a vehicle/handleVehicleChange)', async () => {
    render(
      <MemoryRouter>
        <NewServiceOrderMobile />
      </MemoryRouter>
    );

    expect(await screen.findByText('Nova Ordem de Serviço')).toBeInTheDocument();
    expect(screen.getByText('Tipo de Atendimento')).toBeInTheDocument();
  });

  // OS de guincho só nasce de orçamento aprovado: o botão leva ao orçamento novo.
  it('o botão de guincho abre um orçamento de guincho em vez de criar a OS direto', async () => {
    render(
      <MemoryRouter initialEntries={['/new-service-order']}>
        <Routes>
          <Route path="/new-service-order" element={<NewServiceOrderMobile />} />
          <Route path="/orcamentos-guincho/novo" element={<p>Tela do orçamento</p>} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Nova Ordem de Serviço');
    fireEvent.click(screen.getByRole('button', { name: /guincho/i }));

    expect(await screen.findByText('Tela do orçamento')).toBeInTheDocument();
  });

  it('busca modelos FIPE quando a marca digitada corresponde a uma marca conhecida', async () => {
    render(
      <MemoryRouter>
        <NewServiceOrderMobile />
      </MemoryRouter>
    );

    await screen.findByText('Nova Ordem de Serviço');
    await goToVehicleStep();

    const brandInput = screen.getByPlaceholderText('Digite para buscar (Ex: Toyota)');
    fireEvent.change(brandInput, { target: { value: 'Toyota' } });

    await waitFor(() => {
      const datalist = document.getElementById('fipe-modelos-list');
      expect(datalist?.querySelectorAll('option').length).toBe(2);
    });

    const modelInput = screen.getByPlaceholderText('Digite para buscar (Ex: Corolla)');
    fireEvent.change(modelInput, { target: { value: 'Corolla' } });
    expect(modelInput).toHaveValue('Corolla');
  });

  it('não busca modelos quando a marca digitada não está na tabela FIPE', async () => {
    render(
      <MemoryRouter>
        <NewServiceOrderMobile />
      </MemoryRouter>
    );

    await screen.findByText('Nova Ordem de Serviço');
    await goToVehicleStep();

    const brandInput = screen.getByPlaceholderText('Digite para buscar (Ex: Toyota)');
    fireEvent.change(brandInput, { target: { value: 'Marca Rara Inexistente' } });

    await new Promise(resolve => setTimeout(resolve, 0));
    const datalist = document.getElementById('fipe-modelos-list');
    expect(datalist?.querySelectorAll('option').length).toBe(0);
  });
});
