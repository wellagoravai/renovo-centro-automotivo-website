import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import '../styles/DashboardTV.css';

interface ServiceOrder {
  id: string;
  number: string;
  status: string;
  customerName: string;
  vehicleInfo: string;
  entryDate: string;
  problemReported: string;
}

const DashboardEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // O backend ainda guarda ~15 status granulares (histórico da OS mostra o detalhe),
  // mas o board só faz sentido visualmente com poucas colunas: agrupamos em estágios.
  const stages = [
    { key: 'recebido', label: 'Recebido', dropStatus: 'Recebido', match: ['Recebido', 'Checklist realizado'] },
    { key: 'diagnostico', label: 'Em Diagnóstico', dropStatus: 'Em diagnóstico', match: ['Em diagnóstico', 'Orçamento elaborado'] },
    { key: 'aguardando', label: 'Aguardando', dropStatus: 'Aguardando aprovação', match: ['Aguardando aprovação', 'Aprovado', 'Aguardando peças', 'Peças recebidas'] },
    { key: 'manutencao', label: 'Em Manutenção', dropStatus: 'Em manutenção', match: ['Em manutenção', 'Montagem', 'Testes', 'Lavagem'] },
    { key: 'pronto', label: 'Pronto p/ Retirada', dropStatus: 'Pronto para retirada', match: ['Pronto para retirada'] },
    { key: 'entregue', label: 'Entregue', dropStatus: 'Entregue', match: ['Entregue'] },
  ] as const;
  const cancelledStage = { key: 'cancelado', label: 'Cancelado', dropStatus: 'Cancelado', match: ['Cancelado'] } as const;
  const allStages = [...stages, cancelledStage];

  const [cancelledOpen, setCancelledOpen] = useState(false);
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const getStageForStatus = (status: string) => {
    const stage = allStages.find(s => (s.match as readonly string[]).includes(status));
    return stage ?? stages[0];
  };

  const getOrdersForStage = (stage: { match: readonly string[] }) => {
    return serviceOrders.filter(order => (stage.match as readonly string[]).includes(order.status));
  };

  useEffect(() => {
    loadDashboard();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboard = async () => {
    try {
      // Este Kanban só entende status de Oficina (o `match` dos estágios abaixo é
      // baseado nesse fluxo) — OS de Guincho têm status próprios e são acompanhadas
      // no dashboard dedicado (/guincho), então ficam de fora aqui.
      const response = await api.get('/service-orders?serviceType=Oficina');
      if (response.ok) {
        const data = await response.json();
        setServiceOrders(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string, orderNotes?: string) => {
    const response = await api.patch(`/service-orders/${orderId}/status`, {
      status,
      notes: orderNotes || '',
      changedBy: user?.fullName || 'Usuário Atual',
    });

    if (response.ok) {
      loadDashboard();
      return true;
    }
    const error = await response.json().catch(() => null);
    alert(`❌ Erro: ${error?.message || 'Erro ao atualizar status'}`);
    return false;
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !newStatus) return;

    setUpdating(true);
    try {
      const ok = await updateOrderStatus(selectedOrder.id, newStatus, notes);
      if (ok) {
        setShowStatusModal(false);
        setSelectedOrder(null);
        setNewStatus('');
        setNotes('');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('❌ Erro ao atualizar status');
    } finally {
      setUpdating(false);
    }
  };

  const openStatusModal = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setNotes('');
    setShowStatusModal(true);
  };

  const handleDragStart = (orderId: string) => {
    setDraggedOrderId(orderId);
  };

  const handleDragEnd = () => {
    setDraggedOrderId(null);
    setDragOverStage(null);
  };

  const handleDropOnStage = async (stageDropStatus: string) => {
    setDragOverStage(null);
    if (!draggedOrderId) return;
    const order = serviceOrders.find(o => o.id === draggedOrderId);
    setDraggedOrderId(null);
    if (!order || order.status === stageDropStatus) return;
    if (getStageForStatus(order.status).dropStatus === stageDropStatus) return;
    await updateOrderStatus(order.id, stageDropStatus);
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
      'Cancelado': '#e74c3c',
    };
    return colors[status] || '#7f8c8d';
  };

  // Lista granular usada só no seletor manual do modal (o board agrupa em estágios).
  const detailedStatusList = [
    'Recebido', 'Checklist realizado', 'Em diagnóstico', 'Orçamento elaborado',
    'Aguardando aprovação', 'Aprovado', 'Aguardando peças', 'Peças recebidas',
    'Em manutenção', 'Montagem', 'Testes', 'Lavagem', 'Pronto para retirada',
    'Entregue', 'Cancelado',
  ];

  const getMetrics = () => {
    const total = serviceOrders.length;
    const received = getOrdersForStage(stages[0]).length;
    const inProgress = getOrdersForStage(stages[3]).length;
    const waiting = getOrdersForStage(stages[2]).length;
    const ready = getOrdersForStage(stages[4]).length;
    const delivered = getOrdersForStage(stages[5]).length;
    return { total, received, inProgress, waiting, ready, delivered };
  };

  if (loading) {
    return <div className="loading-tv">Carregando...</div>;
  }

  const metrics = getMetrics();

  return (
    <div className="dashboard-tv">
      {/* Header Principal */}
      <div className="dashboard-tv-header">
        <h1>🔧 RENOVO WORKSHOP - DASHBOARD</h1>
        <div className="dashboard-tv-date">
          {currentTime.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="metrics-container">
        <div className="metric-card total">
          <div className="metric-value">{metrics.total}</div>
          <div className="metric-label">Total OS</div>
        </div>
        <div className="metric-card received">
          <div className="metric-value">{metrics.received}</div>
          <div className="metric-label">Recebidas</div>
        </div>
        <div className="metric-card in-progress">
          <div className="metric-value">{metrics.inProgress}</div>
          <div className="metric-label">Em Manutenção</div>
        </div>
        <div className="metric-card waiting">
          <div className="metric-value">{metrics.waiting}</div>
          <div className="metric-label">Aguardando</div>
        </div>
        <div className="metric-card ready">
          <div className="metric-value">{metrics.ready}</div>
          <div className="metric-label">Prontas</div>
        </div>
        <div className="metric-card delivered">
          <div className="metric-value">{metrics.delivered}</div>
          <div className="metric-label">Entregues</div>
        </div>
      </div>

      {/* Kanban Board — arraste o card para outro estágio para atualizar o status */}
      <div className="kanban-board-tv">
        {stages.map(stage => {
          const orders = getOrdersForStage(stage);
          return (
            <div
              key={stage.key}
              className={`kanban-column-tv ${dragOverStage === stage.key ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.key); }}
              onDragLeave={() => setDragOverStage(prev => (prev === stage.key ? null : prev))}
              onDrop={(e) => { e.preventDefault(); handleDropOnStage(stage.dropStatus); }}
            >
              <div className="column-header-tv">
                <h3>{stage.label}</h3>
                <span className="column-count-tv">{orders.length}</span>
              </div>
              <div className="column-content-tv">
                {orders.map(order => (
                  <div
                    key={order.id}
                    className={`kanban-card-tv ${draggedOrderId === order.id ? 'dragging' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(order.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => navigate(`/service-orders/${order.id}`)}
                  >
                    <div className="card-header-tv">
                      <span className="os-number-tv">OS {order.number}</span>
                      <span
                        className="status-badge-tv"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="card-body-tv">
                      <p className="vehicle-info-tv">🚗 {order.vehicleInfo}</p>
                      <p className="customer-name-tv">👤 {order.customerName}</p>
                      <p className="problem-info-tv">🔧 {order.problemReported || 'Não informado'}</p>
                    </div>
                    <div className="card-footer-tv">
                      <span className="entry-date-tv">
                        📅 {new Date(order.entryDate).toLocaleDateString('pt-BR')}
                      </span>
                      <button
                        className="btn-status-update-tv"
                        onClick={(e) => {
                          e.stopPropagation();
                          openStatusModal(order);
                        }}
                      >
                        ✏️ Atualizar
                      </button>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="empty-column-tv">
                    <p>Nenhuma OS</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Cancelado fica à parte, colapsado por padrão, pra não competir com o fluxo ativo */}
        <div className={`kanban-column-tv kanban-column-cancelled ${cancelledOpen ? '' : 'collapsed'} ${dragOverStage === cancelledStage.key ? 'drag-over' : ''}`}>
          <div
            className="column-header-tv column-header-clickable"
            onClick={() => setCancelledOpen(o => !o)}
            onDragOver={(e) => { e.preventDefault(); setDragOverStage(cancelledStage.key); }}
            onDragLeave={() => setDragOverStage(prev => (prev === cancelledStage.key ? null : prev))}
            onDrop={(e) => { e.preventDefault(); handleDropOnStage(cancelledStage.dropStatus); }}
          >
            <h3>{cancelledStage.label}</h3>
            <span className="column-count-tv">{getOrdersForStage(cancelledStage).length}</span>
          </div>
          {cancelledOpen && (
            <div className="column-content-tv">
              {getOrdersForStage(cancelledStage).map(order => (
                <div
                  key={order.id}
                  className="kanban-card-tv"
                  onClick={() => navigate(`/service-orders/${order.id}`)}
                >
                  <div className="card-header-tv">
                    <span className="os-number-tv">OS {order.number}</span>
                  </div>
                  <div className="card-body-tv">
                    <p className="vehicle-info-tv">🚗 {order.vehicleInfo}</p>
                    <p className="customer-name-tv">👤 {order.customerName}</p>
                  </div>
                </div>
              ))}
              {getOrdersForStage(cancelledStage).length === 0 && (
                <div className="empty-column-tv"><p>Nenhuma OS</p></div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal TV */}
      {showStatusModal && selectedOrder && (
        <div className="modal-overlay-tv" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content-tv" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-tv">
              <h2>Atualizar Status da OS</h2>
              <button className="modal-close-tv" onClick={() => setShowStatusModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateStatus}>
              <div className="form-group-tv">
                <label>Ordem de Serviço:</label>
                <input
                  type="text"
                  value={`OS ${selectedOrder.number}`}
                  disabled
                  className="form-control-tv"
                />
              </div>
              <div className="form-group-tv">
                <label>Cliente:</label>
                <input
                  type="text"
                  value={selectedOrder.customerName}
                  disabled
                  className="form-control-tv"
                />
              </div>
              <div className="form-group-tv">
                <label>Status Atual:</label>
                <input
                  type="text"
                  value={selectedOrder.status}
                  disabled
                  className="form-control-tv"
                />
              </div>
              <div className="form-group-tv">
                <label>Novo Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="form-control-tv"
                  required
                >
                  {detailedStatusList.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="form-group-tv">
                <label>Observações:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione observações sobre a mudança de status..."
                  rows={3}
                  className="form-control-tv"
                />
              </div>
              <div className="modal-actions-tv">
                <button
                  type="button"
                  className="btn-tv btn-secondary-tv"
                  onClick={() => setShowStatusModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-tv btn-primary-tv"
                  disabled={updating}
                >
                  {updating ? '⏳ Atualizando...' : '✅ Atualizar Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardEnhanced;
