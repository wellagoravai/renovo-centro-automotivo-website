import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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

  it('mostra os campos de guincho e a cotação de frete ao selecionar "Guincho 24h"', async () => {
    render(
      <MemoryRouter>
        <NewServiceOrderMobile />
      </MemoryRouter>
    );

    await screen.findByText('Nova Ordem de Serviço');
    fireEvent.click(screen.getByRole('button', { name: /guincho 24h/i }));

    expect(screen.getByText('Local do Atendimento')).toBeInTheDocument();
    expect(screen.getByText('Cotação de Frete Rodoviário')).toBeInTheDocument();
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

  it('inclui os campos de cotação de frete no payload ao criar uma OS de Guincho', async () => {
    (api.post as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ id: 'os-1' }) });

    render(
      <MemoryRouter>
        <NewServiceOrderMobile />
      </MemoryRouter>
    );

    await screen.findByText('Nova Ordem de Serviço');
    fireEvent.click(screen.getByRole('button', { name: /guincho 24h/i }));

    await goToVehicleStep();
    fireEvent.change(screen.getByPlaceholderText('ABC-1234'), { target: { value: 'ABC1D23' } });
    fireEvent.change(screen.getByPlaceholderText('Digite para buscar (Ex: Toyota)'), { target: { value: 'Fiat' } });
    fireEvent.change(screen.getByPlaceholderText('Digite para buscar (Ex: Corolla)'), { target: { value: 'Uno' } });
    fireEvent.change(screen.getByPlaceholderText('2024'), { target: { value: '2020' } });

    clickProximo();
    // "Recepção" também aparece como rótulo no breadcrumb de progresso do wizard,
    // então precisa mirar no heading do passo pra não colidir com múltiplos matches.
    await screen.findByRole('heading', { name: 'Recepção' });
    fireEvent.change(screen.getByPlaceholderText('Descreva o problema relatado pelo cliente'), { target: { value: 'Pane seca' } });

    fireEvent.click(screen.getAllByRole('button', { name: /criar ordem de serviço/i })[0]);

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    const [, payload] = (api.post as jest.Mock).mock.calls[0];
    expect(payload.towDetails).toMatchObject({
      originCity: '', originState: '', destinationCity: '', destinationState: '',
      pricePerKm: null, axleCount: null, distanceKm: null, tollsValue: null, freightTotal: null,
    });
  });
});
