import React, { useState } from 'react';
import { api } from '../services/api';
import '../styles/FreightQuoteCalculator.css';

export interface FreightQuoteValue {
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  pricePerKm: number | null;
  axleCount: number | null;
  distanceKm: number | null;
  tollsValue: number | null;
  freightTotal: number | null;
}

interface FreightQuoteResult {
  distanciaKm: number;
  tempoEstimado: string;
  valorPedagioBase: number;
  valorPedagioEstimado: number;
  multiplicadorPedagioAplicado: number;
  pedagioIndisponivel: boolean;
  precoPorKm: number;
  valorFrete: number;
  precoTotal: number;
  moeda: string;
}

// Estados brasileiros para os selects de origem/destino — lista fixa (não muda),
// diferente da lista de cidades por estado, que vem da API pública do IBGE sob
// demanda (evita carregar ~5.600 municípios de uma vez).
const UF_LIST: { sigla: string; nome: string }[] = [
  { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' },
];

// TimeSpan do .NET serializa como "[d.]hh:mm:ss" — formata pra algo legível tipo "7h 30min".
function formatDuration(timeSpan: string): string {
  const match = timeSpan.match(/^(?:(\d+)\.)?(\d{2}):(\d{2}):\d{2}$/);
  if (!match) return timeSpan;

  const dias = match[1] ? parseInt(match[1], 10) : 0;
  const horas = dias * 24 + parseInt(match[2], 10);
  const minutos = parseInt(match[3], 10);

  if (horas === 0) return `${minutos}min`;
  return minutos === 0 ? `${horas}h` : `${horas}h ${minutos}min`;
}

interface FreightQuoteCalculatorProps {
  value: FreightQuoteValue;
  onChange: (patch: Partial<FreightQuoteValue>) => void;
}

// Bloco de cotação de frete rodoviário (origem/destino por cidade+UF com busca,
// preço/km e número de eixos) usado tanto na criação quanto na edição de uma OS
// de Guincho. Mantém seu próprio estado de UI (cache de cidades, loading, erro,
// resultado) e só propaga pro formulário pai os campos que precisam ser salvos.
const FreightQuoteCalculator: React.FC<FreightQuoteCalculatorProps> = ({ value, onChange }) => {
  const [citiesCache, setCitiesCache] = useState<Record<string, string[]>>({});
  const [loadingCitiesFor, setLoadingCitiesFor] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteResult, setQuoteResult] = useState<FreightQuoteResult | null>(null);

  const ensureCitiesLoaded = async (uf: string) => {
    if (!uf || citiesCache[uf]) return;
    setLoadingCitiesFor(uf);
    try {
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
      const data = await response.json();
      const nomes = Array.isArray(data)
        ? data.map((m: { nome: string }) => m.nome).sort((a: string, b: string) => a.localeCompare(b, 'pt-BR'))
        : [];
      setCitiesCache(prev => ({ ...prev, [uf]: nomes }));
    } catch (error) {
      console.error('Erro ao carregar cidades do IBGE:', error);
    } finally {
      setLoadingCitiesFor(null);
    }
  };

  const handleOriginStateChange = (uf: string) => {
    onChange({ originState: uf, originCity: '' });
    ensureCitiesLoaded(uf);
  };

  const handleDestinationStateChange = (uf: string) => {
    onChange({ destinationState: uf, destinationCity: '' });
    ensureCitiesLoaded(uf);
  };

  const handleBuscarCotacao = async () => {
    const { originCity, originState, destinationCity, destinationState, pricePerKm, axleCount } = value;

    if (!originCity.trim() || !originState || !destinationCity.trim() || !destinationState) {
      setQuoteError('Preencha cidade e estado de origem e de destino.');
      return;
    }
    if (!pricePerKm || pricePerKm <= 0) {
      setQuoteError('Informe o preço por km.');
      return;
    }

    setQuoteLoading(true);
    setQuoteError(null);
    setQuoteResult(null);

    try {
      const response = await api.post('/fretes/cotacao', {
        origemCidade: originCity.trim(),
        origemUf: originState,
        destinoCidade: destinationCity.trim(),
        destinoUf: destinationState,
        precoPorKm: pricePerKm,
        numeroEixos: axleCount,
      });

      if (response.status === 200) {
        const data: FreightQuoteResult = await response.json();
        setQuoteResult(data);
        onChange({
          distanceKm: data.distanciaKm,
          tollsValue: data.valorPedagioEstimado,
          freightTotal: data.precoTotal,
        });
      } else if (response.status === 400) {
        const data = await response.json().catch(() => null);
        setQuoteError(data?.message || 'Dados inválidos para a cotação.');
      } else if (response.status === 404) {
        setQuoteError('Nenhuma rota rodoviária encontrada entre a origem e o destino informados.');
      } else if (response.status === 503) {
        const data = await response.json().catch(() => null);
        setQuoteError(data?.message || 'Serviço de cotação de frete indisponível no momento.');
      } else {
        setQuoteError('Não foi possível calcular a cotação. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao buscar cotação de frete:', error);
      setQuoteError('Não foi possível calcular a cotação. Verifique sua conexão e tente novamente.');
    } finally {
      setQuoteLoading(false);
    }
  };

  return (
    <div className="freight-quote-box">
      <h4>Cotação de Frete Rodoviário</h4>
      <div className="tow-details-grid">
        <div className="form-group">
          <label>Estado de Origem</label>
          <select value={value.originState} onChange={(e) => handleOriginStateChange(e.target.value)}>
            <option value="">Selecione...</option>
            {UF_LIST.map(uf => (
              <option key={uf.sigla} value={uf.sigla}>{uf.nome}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Cidade de Origem</label>
          <input
            type="text"
            list="freight-origin-cities-list"
            value={value.originCity}
            onChange={(e) => onChange({ originCity: e.target.value })}
            placeholder={loadingCitiesFor === value.originState ? 'Carregando cidades...' : 'Digite para buscar'}
            disabled={!value.originState}
          />
          <datalist id="freight-origin-cities-list">
            {(citiesCache[value.originState] || []).map(cidade => (
              <option key={cidade} value={cidade} />
            ))}
          </datalist>
        </div>
        <div className="form-group">
          <label>Estado de Destino</label>
          <select value={value.destinationState} onChange={(e) => handleDestinationStateChange(e.target.value)}>
            <option value="">Selecione...</option>
            {UF_LIST.map(uf => (
              <option key={uf.sigla} value={uf.sigla}>{uf.nome}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Cidade de Destino</label>
          <input
            type="text"
            list="freight-destination-cities-list"
            value={value.destinationCity}
            onChange={(e) => onChange({ destinationCity: e.target.value })}
            placeholder={loadingCitiesFor === value.destinationState ? 'Carregando cidades...' : 'Digite para buscar'}
            disabled={!value.destinationState}
          />
          <datalist id="freight-destination-cities-list">
            {(citiesCache[value.destinationState] || []).map(cidade => (
              <option key={cidade} value={cidade} />
            ))}
          </datalist>
        </div>
        <div className="form-group">
          <label>Preço por Km (R$)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={value.pricePerKm ?? ''}
            onChange={(e) => onChange({ pricePerKm: e.target.value === '' ? null : Number(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>Número de Eixos (guincho + prancha)</label>
          <select
            value={value.axleCount ?? ''}
            onChange={(e) => onChange({ axleCount: e.target.value === '' ? null : Number(e.target.value) })}
          >
            <option value="">Padrão (2 eixos)</option>
            <option value="2">2 eixos</option>
            <option value="3">3 eixos</option>
            <option value="4">4 ou mais eixos</option>
          </select>
        </div>
      </div>

      <button type="button" className="btn-primary" onClick={handleBuscarCotacao} disabled={quoteLoading}>
        {quoteLoading ? 'Calculando...' : 'Buscar cotação de frete'}
      </button>

      {quoteError && <div className="freight-quote-erro">{quoteError}</div>}

      {quoteResult && (
        <div className="freight-quote-resultado">
          <div><strong>Distância:</strong> {quoteResult.distanciaKm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km</div>
          <div><strong>Tempo estimado:</strong> {formatDuration(quoteResult.tempoEstimado)}</div>
          <div>
            <strong>Pedágio estimado:</strong> R$ {quoteResult.valorPedagioEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            {' '}(×{quoteResult.multiplicadorPedagioAplicado} sobre referência de passeio de R$ {quoteResult.valorPedagioBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
          </div>
          {quoteResult.pedagioIndisponivel && (
            <div className="freight-quote-aviso">
              A Google não retornou dado de pedágio para esta rota — pode ser uma rota sem pedágio, ou a informação
              simplesmente não está disponível. Valor de pedágio considerado como R$ 0,00.
            </div>
          )}
          <div><strong>Valor do frete (km × preço):</strong> R$ {quoteResult.valorFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className="freight-quote-total">
            <strong>Preço total do guincho:</strong> R$ {quoteResult.precoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="tab-hint">
            Valores são uma estimativa (pedágio de caminhão ajustado por multiplicador aproximado, não por tarifa real
            de concessionária). Confirme antes de repassar ao cliente.
          </p>
        </div>
      )}
    </div>
  );
};

export const emptyFreightQuoteValue: FreightQuoteValue = {
  originCity: '',
  originState: '',
  destinationCity: '',
  destinationState: '',
  pricePerKm: null,
  axleCount: null,
  distanceKm: null,
  tollsValue: null,
  freightTotal: null,
};

export default FreightQuoteCalculator;
