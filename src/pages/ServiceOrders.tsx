import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import '../styles/ServiceOrders.css';

interface ServiceOrder {
  id: string;
  number: string;
  status: string;
  serviceType: string;
  entryDate: string;
  estimatedDate?: string;
  finalDate?: string;
  customerName: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  problemReported: string;
  value: number;
}

const ServiceOrders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showMine, setShowMine] = useState(false);
  const { user, hasPermission } = useAuth();

  const isMechanic = user?.role === 'Mecânico';

  useEffect(() => {
    loadOrders();
  }, [statusFilter, search, showMine]);

  const loadOrders = async () => {
    try {
      let url = '/service-orders';
      const params = new URLSearchParams();

      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);
      if (showMine && isMechanic && user) params.append('assignedUserId', user.id);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await api.get(url);

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        console.error('Erro na resposta:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Erro ao carregar ordens:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'Recebido': '#3498db',
      'Checklist realizado': '#9b59b6',
      'Em diagnóstico': '#f39c12',
      'Orçamento elaborado': '#1abc9c',
      'Aguardando aprovação': '#e74c3c',
      'Aprovado': '#27ae60',
      'Aguardando peças': '#e67e22',
      'Peças recebidas': '#16a085',
      'Em manutenção': '#3498db',
      'Montagem': '#8e44ad',
      'Testes': '#1abc9c',
      'Lavagem': '#3498db',
      'Pronto para retirada': '#27ae60',
      'Entregue': '#95a5a6',
      'Cancelado': '#e74c3c'
    };
    return colors[status] || '#7f8c8d';
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="service-orders-page">
      <div className="page-header">
        <h1>Ordens de Serviço</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {isMechanic && (
            <button
              className={showMine ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setShowMine((v) => !v)}
            >
              {showMine ? 'Ver Todas as Ordens' : 'Minhas Ordens'}
            </button>
          )}
          {hasPermission('orders.write') && (
            <button className="btn btn-primary" onClick={() => navigate('/new-service-order')}>
              + Nova Ordem
            </button>
          )}
        </div>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Buscar por número, cliente ou placa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-control search-input"
        />
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-control filter-select"
        >
          <option value="">Todos os Status</option>
          <option value="Recebido">Recebido</option>
          <option value="Checklist realizado">Checklist Realizado</option>
          <option value="Em diagnóstico">Em Diagnóstico</option>
          <option value="Orçamento elaborado">Orçamento Elaborado</option>
          <option value="Aguardando aprovação">Aguardando Aprovação</option>
          <option value="Aprovado">Aprovado</option>
          <option value="Aguardando peças">Aguardando Peças</option>
          <option value="Peças recebidas">Peças Recebidas</option>
          <option value="Em manutenção">Em Manutenção</option>
          <option value="Montagem">Montagem</option>
          <option value="Testes">Testes</option>
          <option value="Lavagem">Lavagem</option>
          <option value="Pronto para retirada">Pronto para Retirada</option>
          <option value="Entregue">Entregue</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>

      <div className="orders-grid">
        {orders.map(order => (
          <div
            key={order.id}
            className="order-card"
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/service-orders/${order.id}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') navigate(`/service-orders/${order.id}`);
            }}
          >
            <div className="order-header">
              <div className="order-number">
                <span
                  className="order-type-emoji"
                  title={order.serviceType === 'Guincho' ? 'Guincho' : 'Oficina'}
                  aria-label={order.serviceType === 'Guincho' ? 'Guincho' : 'Oficina'}
                >
                  {order.serviceType === 'Guincho' ? '🚛' : '🔧'}
                </span>
                #{order.number}
              </div>
              <div
                className="order-status"
                style={{ backgroundColor: getStatusColor(order.status) }}
              >
                {order.status}
              </div>
            </div>
            
            <div className="order-body">
              <div className="order-info">
                <div className="info-row">
                  <span className="info-label">Cliente:</span>
                  <span className="info-value">{order.customerName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Veículo:</span>
                  <span className="info-value">{order.vehiclePlate} - {order.vehicleBrand} {order.vehicleModel}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Entrada:</span>
                  <span className="info-value">{new Date(order.entryDate).toLocaleDateString('pt-BR')}</span>
                </div>
                {order.estimatedDate && (
                  <div className="info-row">
                    <span className="info-label">Previsão:</span>
                    <span className="info-value">{new Date(order.estimatedDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label">Valor:</span>
                  <span className="info-value value">R$ {order.value.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="order-problem">
                <strong>Problema:</strong>
                <p>{order.problemReported || 'Não informado'}</p>
              </div>
            </div>
            
              <div className="order-actions">
                <button className="btn btn-sm btn-info" onClick={() => navigate(`/service-orders/${order.id}`)}>
                  Ver Detalhes
                </button>
              </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="empty-state">
          <p>Nenhuma ordem de serviço encontrada</p>
        </div>
      )}
    </div>
  );
};

export default ServiceOrders;