import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FreightQuoteCalculator, { emptyFreightQuoteValue, FreightQuoteValue } from './FreightQuoteCalculator';
import { api } from '../services/api';

jest.mock('../services/api', () => ({
  api: {
    post: jest.fn(),
  },
}));

function Wrapper({ initial }: { initial?: Partial<FreightQuoteValue> }) {
  const [value, setValue] = React.useState<FreightQuoteValue>({ ...emptyFreightQuoteValue, ...initial });
  const onChange = (patch: Partial<FreightQuoteValue>) => setValue(prev => ({ ...prev, ...patch }));
  return <FreightQuoteCalculator value={value} onChange={onChange} />;
}

function mockIbgeFetch() {
  global.fetch = jest.fn(() =>
    Promise.resolve({ json: async () => [{ nome: 'Uberlândia' }, { nome: 'Belo Horizonte' }] } as Response)
  ) as jest.Mock;
}

describe('FreightQuoteCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIbgeFetch();
  });

  it('renderiza os campos de origem, destino, preço/km e eixos', () => {
    render(<Wrapper />);

    expect(screen.getByText('Estado de Origem')).toBeInTheDocument();
    expect(screen.getByText('Estado de Destino')).toBeInTheDocument();
    expect(screen.getByText('Preço por Km (R$)')).toBeInTheDocument();
    expect(screen.getByText('Número de Eixos (guincho + prancha)')).toBeInTheDocument();
  });

  it('busca cidades do IBGE ao selecionar um estado de origem', async () => {
    render(<Wrapper />);

    const [originStateSelect] = screen.getAllByRole('combobox');
    fireEvent.change(originStateSelect, { target: { value: 'MG' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('https://servicodados.ibge.gov.br/api/v1/localidades/estados/MG/municipios');
    });

    await waitFor(() => {
      const datalist = document.getElementById('freight-origin-cities-list');
      expect(datalist?.querySelectorAll('option').length).toBe(2);
    });
  });

  it('não chama a API de cotação e mostra erro quando faltam campos obrigatórios', () => {
    render(<Wrapper />);

    fireEvent.click(screen.getByRole('button', { name: /buscar cotação de frete/i }));

    expect(screen.getByText('Preencha cidade e estado de origem e de destino.')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('mostra erro de preço/km quando origem e destino estão preenchidos mas o preço não', () => {
    render(<Wrapper initial={{ originCity: 'Uberlândia', originState: 'MG', destinationCity: 'São Paulo', destinationState: 'SP' }} />);

    fireEvent.click(screen.getByRole('button', { name: /buscar cotação de frete/i }));

    expect(screen.getByText('Informe o preço por km.')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('busca a cotação e exibe o resultado quando todos os campos são válidos', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      status: 200,
      json: async () => ({
        distanciaKm: 100,
        tempoEstimado: '02:00:00',
        valorPedagioBase: 20,
        valorPedagioEstimado: 30,
        multiplicadorPedagioAplicado: 1.5,
        pedagioIndisponivel: false,
        precoPorKm: 4.5,
        valorFrete: 450,
        precoTotal: 480,
        moeda: 'BRL',
      }),
    });

    render(
      <Wrapper
        initial={{
          originCity: 'Uberlândia', originState: 'MG',
          destinationCity: 'São Paulo', destinationState: 'SP',
          pricePerKm: 4.5, axleCount: 2,
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /buscar cotação de frete/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/fretes/cotacao', {
      origemCidade: 'Uberlândia',
      origemUf: 'MG',
      destinoCidade: 'São Paulo',
      destinoUf: 'SP',
      precoPorKm: 4.5,
      numeroEixos: 2,
    }));

    expect(await screen.findByText(/preço total do guincho/i)).toBeInTheDocument();
    expect(screen.getByText(/480,00/)).toBeInTheDocument();
  });

  it('mostra mensagem de rota não encontrada em resposta 404', async () => {
    (api.post as jest.Mock).mockResolvedValue({ status: 404, json: async () => ({}) });

    render(
      <Wrapper
        initial={{
          originCity: 'Uberlândia', originState: 'MG',
          destinationCity: 'São Paulo', destinationState: 'SP',
          pricePerKm: 4.5,
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /buscar cotação de frete/i }));

    expect(await screen.findByText('Nenhuma rota rodoviária encontrada entre a origem e o destino informados.')).toBeInTheDocument();
  });
});
