import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/TowDashboard.css';

interface TowKpis {
  callsReceived: number;
  enRouteToPickup: number;
  vehicleLoaded: number;
  inTransport: number;
  deliveredToday: number;
  cancelled: number;
  activeCalls: number;
  callsStartedToday: number;
}

const emptyKpis: TowKpis = {
  callsReceived: 0,
  enRouteToPickup: 0,
  vehicleLoaded: 0,
  inTransport: 0,
  deliveredToday: 0,
  cancelled: 0,
  activeCalls: 0,
  callsStartedToday: 0,
};

interface TowServiceOrder {
  id: string;
  number: string;
  status: string;
  customerName: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  entryDate: string;
  problemReported: string;
}

const kpiTiles: { key: keyof TowKpis; label: string; icon: string }[] = [
  { key: 'activeCalls', label: 'Chamados Ativos', icon: '🚨' },
  { key: 'callsStartedToday', label: 'Chamados Hoje', icon: '📞' },
  { key: 'callsReceived', label: 'Chamado Recebido', icon: '📋' },
  { key: 'enRouteToPickup', label: 'A Caminho do Local', icon: '🛣️' },
  { key: 'vehicleLoaded', label: 'Veículo Carregado', icon: '🚗' },
  { key: 'inTransport', label: 'Em Transporte', icon: '🚛' },
  { key: 'deliveredToday', label: 'Entregues Hoje', icon: '✅' },
  { key: 'cancelled', label: 'Cancelados', icon: '❌' },
];

const getStatusColor = (status: string) => {
  const colors: { [key: string]: string } = {
    'Chamado recebido': '#3498db',
    'A caminho do local': '#f39c12',
    'Veículo carregado': '#9b59b6',
    'Em transporte': '#e67e22',
    'Entregue': '#27ae60',
    'Cancelado': '#e74c3c',
  };
  return colors[status] || '#7f8c8d';
};

const TowDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<TowKpis>(emptyKpis);
  const [orders, setOrders] = useState<TowServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpisResponse, ordersResponse] = await Promise.all([
        api.get('/dashboard/tow'),
        api.get('/service-orders?serviceType=Guincho'),
      ]);
      if (kpisResponse.ok) {
        setKpis(await kpisResponse.json());
      }
      if (ordersResponse.ok) {
        setOrders(await ordersResponse.json());
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard de guincho:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'Entregue' && o.status !== 'Cancelado');

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="tow-dashboard-page">
      <div className="page-header">
        <h1>🚛 Guincho 24h</h1>
        <button className="btn btn-primary" onClick={() => navigate('/new-service-order')}>
          + Novo Chamado
        </button>
      </div>

      <div className="tow-kpi-grid">
        {kpiTiles.map(tile => (
          <div key={tile.key} className="tow-kpi-card">
            <div className="tow-kpi-icon">{tile.icon}</div>
            <div className="tow-kpi-value">{kpis[tile.key]}</div>
            <div className="tow-kpi-label">{tile.label}</div>
          </div>
        ))}
      </div>

      <h2 className="tow-list-title">Chamados Ativos</h2>
      <div className="tow-orders-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>OS</th>
              <th>Placa</th>
              <th>Veículo</th>
              <th>Cliente</th>
              <th>Status</th>
              <th>Entrada</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {activeOrders.map(order => (
              <tr
                key={order.id}
                className="tow-order-row"
                onClick={() => navigate(`/service-orders/${order.id}`)}
              >
                <td>{order.number}</td>
                <td>{order.vehiclePlate}</td>
                <td>{order.vehicleBrand} {order.vehicleModel}</td>
                <td>{order.customerName}</td>
                <td>
                  <span
                    className="tow-status-badge"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {order.status}
                  </span>
                </td>
                <td>{new Date(order.entryDate).toLocaleString('pt-BR')}</td>
                <td>
                  <button
                    className="btn-sm btn-info"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/service-orders/${order.id}`);
                    }}
                  >
                    Ver Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {activeOrders.length === 0 && (
          <div className="empty-state">
            <p>Nenhum chamado de guincho ativo no momento</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TowDashboard;
