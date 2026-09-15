import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import '../styles/Vehicles.css';

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  engine: string;
  fuel: string;
  mileage: number;
  chassis: string;
  renavam: string;
  customerId: string;
  customerName: string;
  serviceOrderCount: number;
  createdAt: string;
}

interface VeiculoConsultaResult {
  placa: string;
  chassi: string | null;
  marca: string | null;
  modelo: string | null;
  anoFabricacao: number | null;
  anoModelo: number | null;
  cor: string | null;
  municipioUf: string | null;
  dataConsulta: string;
  fonteDados: string;
}

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { hasPermission } = useAuth();

  const [consultaPlaca, setConsultaPlaca] = useState('');
  const [consultaLoading, setConsultaLoading] = useState(false);
  const [consultaError, setConsultaError] = useState<string | null>(null);
  const [consultaResultado, setConsultaResultado] = useState<VeiculoConsultaResult | null>(null);

  useEffect(() => {
    loadVehicles();
  }, [search]);

  const loadVehicles = async () => {
    try {
      const url = search ? `/Vehicles?search=${encodeURIComponent(search)}` : '/Vehicles';
      const response = await api.get(url);
      const data = await response.json();
      setVehicles(data);
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscarDadosVeiculo = async () => {
    const placa = consultaPlaca.trim();
    if (!placa) {
      setConsultaError('Informe a placa do veículo.');
      return;
    }

    const confirmado = window.confirm(
      'Deseja realmente fazer uma busca na base de dados do Governo (APIBrasil) para este veículo? Isso pode gerar custos.'
    );
    if (!confirmado) return;

    setConsultaLoading(true);
    setConsultaError(null);
    setConsultaResultado(null);

    try {
      const response = await api.get(`/veiculos/${encodeURIComponent(placa)}`);

      if (response.status === 200) {
        const data = await response.json();
        setConsultaResultado(data);
      } else if (response.status === 400) {
        const data = await response.json().catch(() => null);
        setConsultaError(data?.message || 'Placa em formato inválido.');
      } else if (response.status === 404) {
        setConsultaError('Nenhum veículo encontrado para esta placa.');
      } else if (response.status === 429) {
        setConsultaError('Limite diário de consultas à APIBrasil foi atingido. Tente novamente mais tarde.');
      } else if (response.status === 503) {
        const data = await response.json().catch(() => null);
        setConsultaError(data?.message || 'Serviço de consulta veicular indisponível no momento.');
      } else {
        setConsultaError('Não foi possível concluir a consulta. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao consultar dados do veículo:', error);
      setConsultaError('Não foi possível concluir a consulta. Verifique sua conexão e tente novamente.');
    } finally {
      setConsultaLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="vehicles-page">
      <div className="page-header">
        <h1>Veículos</h1>
        {hasPermission('vehicles.write') && (
          <button className="btn btn-primary" onClick={() => alert('Funcionalidade em desenvolvimento')}>
            + Novo Veículo
          </button>
        )}
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar por placa, marca, modelo ou chassi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-control"
        />
      </div>

      {hasPermission('vehicles.write') && (
        <div className="consulta-veiculo-card">
          <h2>Consulta de dados veiculares (APIBrasil)</h2>
          <p className="consulta-veiculo-hint">
            Busca marca, modelo, chassi e demais dados oficiais do veículo pela placa. Cada consulta pode gerar custo.
          </p>
          <div className="consulta-veiculo-form">
            <input
              type="text"
              placeholder="Ex.: ABC1D23"
              value={consultaPlaca}
              onChange={(e) => setConsultaPlaca(e.target.value.toUpperCase())}
              maxLength={8}
              className="form-control"
            />
            <button
              className="btn btn-primary"
              onClick={handleBuscarDadosVeiculo}
              disabled={consultaLoading}
            >
              {consultaLoading ? 'Buscando...' : 'Buscar dados do veículo'}
            </button>
          </div>

          {consultaError && <div className="consulta-veiculo-erro">{consultaError}</div>}

          {consultaResultado && (
            <div className="consulta-veiculo-resultado">
              <div><strong>Placa:</strong> {consultaResultado.placa}</div>
              <div><strong>Marca:</strong> {consultaResultado.marca || '—'}</div>
              <div><strong>Modelo:</strong> {consultaResultado.modelo || '—'}</div>
              <div><strong>Ano fabricação/modelo:</strong> {consultaResultado.anoFabricacao || '—'}/{consultaResultado.anoModelo || '—'}</div>
              <div><strong>Cor:</strong> {consultaResultado.cor || '—'}</div>
              <div><strong>Chassi:</strong> {consultaResultado.chassi || '—'}</div>
              <div><strong>Município/UF:</strong> {consultaResultado.municipioUf || '—'}</div>
              <div className="consulta-veiculo-fonte">
                Fonte: {consultaResultado.fonteDados === 'Cache' ? 'cache (consulta anterior)' : 'APIBrasil (consulta em tempo real)'}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Placa</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Ano</th>
              <th>Cor</th>
              <th>Motor</th>
              <th>Combustível</th>
              <th>Quilometragem</th>
              <th>Proprietário</th>
              <th>Ordens</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(vehicle => (
              <tr key={vehicle.id}>
                <td><strong>{vehicle.plate}</strong></td>
                <td>{vehicle.brand}</td>
                <td>{vehicle.model}</td>
                <td>{vehicle.year}</td>
                <td>{vehicle.color}</td>
                <td>{vehicle.engine}</td>
                <td>{vehicle.fuel}</td>
                <td>{vehicle.mileage.toLocaleString('pt-BR')} km</td>
                <td>{vehicle.customerName}</td>
                <td>{vehicle.serviceOrderCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {vehicles.length === 0 && (
        <div className="empty-state">
          <p>Nenhum veículo encontrado</p>
        </div>
      )}
    </div>
  );
};

export default Vehicles;