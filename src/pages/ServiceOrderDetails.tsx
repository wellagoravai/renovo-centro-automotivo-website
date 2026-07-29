import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import ServiceOrderPrintView from '../components/ServiceOrderPrintView';
import '../styles/ServiceOrderDetails.css';

interface HistoryEntry {
  id: string;
  status: string;
  changedAt: string;
  changedBy: string;
  notes: string;
}

interface OrderItem {
  id: string;
  inventoryItemId: string;
  itemCode: string;
  itemDescription: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
}

interface ServiceOrder {
  id: string;
  number: string;
  status: string;
  customerName: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleColor?: string;
  vehicleYear?: number;
  vehicleMileage?: number;
  problemReported: string;
  diagnosis?: string;
  services?: string;
  parts?: string;
  estimatedTime?: number;
  value?: number;
  notes?: string;
  entryDate: string;
  estimatedDate?: string;
  finalDate?: string;
  photos?: string;
  responsibleUser?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  hasChecklist: boolean;
  checklistId?: string;
  vehicleId: string;
  history: HistoryEntry[];
  items: OrderItem[];
}

interface ChecklistForm {
  mileage: number;
  fuelLevel: string;
  tireCondition: string;
  coolingLevel: string;
  oilLevel: string;
  steeringFluidLevel: string;
  tirePressure: string;
  spareTire: boolean;
  rims: boolean;
  headlights: boolean;
  taillights: boolean;
  mirrors: boolean;
  windows: boolean;
  windshield: boolean;
  wipers: boolean;
  seats: boolean;
  dashboard: boolean;
  multimedia: boolean;
  airConditioning: boolean;
  jack: boolean;
  triangle: boolean;
  spareKey: boolean;
  documents: boolean;
  generalState: string;
  observations: string;
  visualDamage: string;
  responsibleUser: string;
}

const emptyChecklist: ChecklistForm = {
  mileage: 0,
  fuelLevel: '',
  tireCondition: '',
  coolingLevel: '',
  oilLevel: '',
  steeringFluidLevel: '',
  tirePressure: '',
  spareTire: false,
  rims: false,
  headlights: false,
  taillights: false,
  mirrors: false,
  windows: false,
  windshield: false,
  wipers: false,
  seats: false,
  dashboard: false,
  multimedia: false,
  airConditioning: false,
  jack: false,
  triangle: false,
  spareKey: false,
  documents: false,
  generalState: '',
  observations: '',
  visualDamage: '',
  responsibleUser: '',
};

const checklistBooleanFields: { key: keyof ChecklistForm; label: string }[] = [
  { key: 'spareTire', label: 'Estepe' },
  { key: 'rims', label: 'Rodas' },
  { key: 'headlights', label: 'Faróis' },
  { key: 'taillights', label: 'Lanternas' },
  { key: 'mirrors', label: 'Retrovisores' },
  { key: 'windows', label: 'Vidros' },
  { key: 'windshield', label: 'Para-brisa' },
  { key: 'wipers', label: 'Palhetas' },
  { key: 'seats', label: 'Bancos' },
  { key: 'dashboard', label: 'Painel' },
  { key: 'multimedia', label: 'Multimídia' },
  { key: 'airConditioning', label: 'Ar-condicionado' },
  { key: 'jack', label: 'Macaco' },
  { key: 'triangle', label: 'Triângulo' },
  { key: 'spareKey', label: 'Chave reserva' },
  { key: 'documents', label: 'Documentos' },
];

interface InventoryResult {
  id: string;
  code: string;
  description: string;
  saleValue: number;
  quantity: number;
}

interface AssignableUser {
  id: string;
  fullName: string;
  role: string;
}

const ServiceOrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dados');
  const [serviceOrder, setServiceOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const [diagnosisForm, setDiagnosisForm] = useState({
    diagnosis: '', services: '', estimatedTime: 0, value: 0, notes: '',
  });
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);

  const [checklist, setChecklist] = useState<ChecklistForm>(emptyChecklist);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [savingChecklist, setSavingChecklist] = useState(false);

  const [photos, setPhotos] = useState<string[]>([]);
  const [savingPhotos, setSavingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [itemSearch, setItemSearch] = useState('');
  const [itemResults, setItemResults] = useState<InventoryResult[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [searchingItems, setSearchingItems] = useState(false);

  const [mechanics, setMechanics] = useState<AssignableUser[]>([]);
  const [assignedUserId, setAssignedUserId] = useState('');
  const [savingAssignment, setSavingAssignment] = useState(false);

  useEffect(() => {
    loadServiceOrder();
    loadMechanics();
  }, [id]);

  const loadMechanics = async () => {
    try {
      const response = await api.get('/Users/assignable?role=Mecânico');
      if (response.ok) {
        setMechanics(await response.json());
      }
    } catch (error) {
      console.error('Erro ao carregar mecânicos:', error);
    }
  };

  const loadServiceOrder = async () => {
    try {
      const response = await api.get(`/service-orders/${id}`);
      if (response.ok) {
        const data: ServiceOrder = await response.json();
        setServiceOrder(data);
        setDiagnosisForm({
          diagnosis: data.diagnosis || '',
          services: data.services || '',
          estimatedTime: data.estimatedTime || 0,
          value: data.value || 0,
          notes: data.notes || '',
        });
        setPhotos(data.photos ? data.photos.split(',').filter(Boolean) : []);
        setAssignedUserId(data.assignedUserId || '');
        if (data.hasChecklist && data.checklistId) {
          loadChecklist(data.checklistId);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar OS:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChecklist = async (checklistId: string) => {
    setChecklistLoading(true);
    try {
      const response = await api.get(`/checklists/${checklistId}`);
      if (response.ok) {
        const data = await response.json();
        setChecklist({ ...emptyChecklist, ...data });
      }
    } catch (error) {
      console.error('Erro ao carregar checklist:', error);
    } finally {
      setChecklistLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Recebido': '#3498db',
      'Em diagnóstico': '#9b59b6',
      'Orçamento elaborado': '#f39c12',
      'Aguardando aprovação': '#e67e22',
      'Aguardando peças': '#e74c3c',
      'Em manutenção': '#1abc9c',
      'Testes': '#2ecc71',
      'Lavagem': '#16a085',
      'Pronto para retirada': '#27ae60',
      'Entregue': '#95a5a6',
      'Cancelado': '#e74c3c',
    };
    return colors[status] || '#7f8c8d';
  };

  const handleSaveDiagnosis = async () => {
    if (!serviceOrder) return;
    setSavingDiagnosis(true);
    try {
      const response = await api.put(`/service-orders/${serviceOrder.id}`, diagnosisForm);
      if (response.ok) {
        const updated = await response.json();
        setServiceOrder(updated);
        alert('✅ Diagnóstico salvo com sucesso!');
      } else {
        alert('❌ Erro ao salvar diagnóstico');
      }
    } catch (error) {
      console.error('Erro ao salvar diagnóstico:', error);
      alert('❌ Erro ao salvar diagnóstico');
    } finally {
      setSavingDiagnosis(false);
    }
  };

  const handleSaveAssignment = async () => {
    if (!serviceOrder) return;
    setSavingAssignment(true);
    try {
      const response = await api.put(`/service-orders/${serviceOrder.id}`, {
        ...diagnosisForm,
        photos: serviceOrder.photos || '',
        assignedUserId: assignedUserId || null,
      });
      if (response.ok) {
        const updated = await response.json();
        setServiceOrder(updated);
        alert('✅ Mecânico atribuído com sucesso!');
      } else {
        alert('❌ Erro ao atribuir mecânico');
      }
    } catch (error) {
      console.error('Erro ao atribuir mecânico:', error);
      alert('❌ Erro ao atribuir mecânico');
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleChecklistChange = <K extends keyof ChecklistForm>(key: K, value: ChecklistForm[K]) => {
    setChecklist(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveChecklist = async () => {
    if (!serviceOrder) return;
    setSavingChecklist(true);
    try {
      const payload = {
        ...checklist,
        vehicleId: serviceOrder.vehicleId,
        serviceOrderId: serviceOrder.id,
      };
      const response = serviceOrder.checklistId
        ? await api.put(`/checklists/${serviceOrder.checklistId}`, payload)
        : await api.post('/checklists', payload);

      if (response.ok) {
        alert('✅ Checklist salvo com sucesso!');
        loadServiceOrder();
      } else {
        alert('❌ Erro ao salvar checklist');
      }
    } catch (error) {
      console.error('Erro ao salvar checklist:', error);
      alert('❌ Erro ao salvar checklist');
    } finally {
      setSavingChecklist(false);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setPhotos(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSavePhotos = async () => {
    if (!serviceOrder) return;
    setSavingPhotos(true);
    try {
      const response = await api.put(`/service-orders/${serviceOrder.id}`, {
        ...diagnosisForm,
        photos: photos.join(','),
      });
      if (response.ok) {
        const updated = await response.json();
        setServiceOrder(updated);
        alert('✅ Fotos salvas com sucesso!');
      } else {
        alert('❌ Erro ao salvar fotos');
      }
    } catch (error) {
      console.error('Erro ao salvar fotos:', error);
      alert('❌ Erro ao salvar fotos');
    } finally {
      setSavingPhotos(false);
    }
  };

  const handleSearchItems = async () => {
    if (!itemSearch.trim()) return;
    setSearchingItems(true);
    try {
      const response = await api.get(`/Inventory?search=${encodeURIComponent(itemSearch)}`);
      if (response.ok) {
        setItemResults(await response.json());
      }
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
    } finally {
      setSearchingItems(false);
    }
  };

  const handleAddItem = async (inventoryItemId: string) => {
    if (!serviceOrder) return;
    const quantity = itemQuantities[inventoryItemId] || 1;
    try {
      const response = await api.post(`/service-orders/${serviceOrder.id}/items`, { inventoryItemId, quantity });
      if (response.ok) {
        const updated = await response.json();
        setServiceOrder(updated);
        setItemResults([]);
        setItemSearch('');
      } else {
        const error = await response.json().catch(() => null);
        alert(`❌ ${error?.message || 'Erro ao adicionar peça'}`);
      }
    } catch (error) {
      console.error('Erro ao adicionar peça:', error);
      alert('❌ Erro ao adicionar peça');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!serviceOrder) return;
    try {
      const response = await api.delete(`/service-orders/${serviceOrder.id}/items/${itemId}`);
      if (response.ok || response.status === 204) {
        loadServiceOrder();
      }
    } catch (error) {
      console.error('Erro ao remover peça:', error);
    }
  };

  const tabs = [
    { id: 'dados', label: 'Dados' },
    { id: 'diagnostico', label: 'Diagnóstico' },
    { id: 'checklist', label: 'Checklist' },
    { id: 'fotos', label: 'Fotos' },
    { id: 'pecas', label: 'Peças Usadas' },
    { id: 'historico', label: 'Histórico' },
  ];

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (!serviceOrder) {
    return <div className="error">Ordem de serviço não encontrada</div>;
  }

  return (
    <div className="service-order-details">
      <div className="os-header">
        <div className="os-title">
          <h1>OS {serviceOrder.number}</h1>
          <span
            className="status-badge"
            style={{ backgroundColor: getStatusColor(serviceOrder.status) }}
          >
            {serviceOrder.status}
          </span>
        </div>
        <div className="os-header-actions">
          <button className="btn-print" onClick={() => window.print()}>
            🖨️ Imprimir Ordem
          </button>
          <button className="btn-back" onClick={() => navigate('/service-orders')}>
            ← Voltar
          </button>
        </div>
      </div>

      <div className="os-info-cards">
        <div className="info-card">
          <h3>Cliente</h3>
          <p>{serviceOrder.customerName}</p>
        </div>
        <div className="info-card">
          <h3>Veículo</h3>
          <p>{serviceOrder.vehiclePlate} — {serviceOrder.vehicleBrand} {serviceOrder.vehicleModel}</p>
          <p>
            {[
              serviceOrder.vehicleColor,
              serviceOrder.vehicleYear ? String(serviceOrder.vehicleYear) : null,
            ].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
        <div className="info-card">
          <h3>Entrada</h3>
          <p>{new Date(serviceOrder.entryDate).toLocaleString('pt-BR')}</p>
        </div>
        <div className="info-card">
          <h3>Previsão de Conclusão</h3>
          <p>{serviceOrder.estimatedDate ? new Date(serviceOrder.estimatedDate).toLocaleString('pt-BR') : 'Não definida'}</p>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs-header">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'dados' && (
            <div className="tab-pane">
              <h3>Dados da Ordem de Serviço</h3>
              <div className="data-grid">
                <div className="data-item">
                  <label>Número da OS:</label>
                  <span>{serviceOrder.number}</span>
                </div>
                <div className="data-item">
                  <label>Status:</label>
                  <span>{serviceOrder.status}</span>
                </div>
                <div className="data-item">
                  <label>Data de Entrada:</label>
                  <span>{new Date(serviceOrder.entryDate).toLocaleString('pt-BR')}</span>
                </div>
                <div className="data-item">
                  <label>Problema Relatado:</label>
                  <span>{serviceOrder.problemReported}</span>
                </div>
                <div className="data-item">
                  <label>Mecânico Responsável:</label>
                  <span>{serviceOrder.responsibleUser || '—'}</span>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 20 }}>
                <label>Atribuir a (app mobile da equipe)</label>
                <select value={assignedUserId} onChange={(e) => setAssignedUserId(e.target.value)}>
                  <option value="">Não atribuído</option>
                  {mechanics.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
                </select>
                <button
                  className="btn-primary"
                  style={{ marginTop: 10 }}
                  onClick={handleSaveAssignment}
                  disabled={savingAssignment}
                >
                  {savingAssignment ? 'Salvando...' : 'Salvar Atribuição'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'diagnostico' && (
            <div className="tab-pane">
              <h3>Diagnóstico e Orçamento</h3>
              <div className="form-group">
                <label>Descrição Técnica</label>
                <textarea
                  placeholder="Digite o diagnóstico técnico"
                  rows={4}
                  value={diagnosisForm.diagnosis}
                  onChange={(e) => setDiagnosisForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Serviços Realizados</label>
                <textarea
                  placeholder="Ex: Troca de óleo, alinhamento, balanceamento"
                  rows={3}
                  value={diagnosisForm.services}
                  onChange={(e) => setDiagnosisForm(prev => ({ ...prev, services: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Horas de Serviço</label>
                <input
                  type="number" step="0.5" min="0"
                  value={diagnosisForm.estimatedTime}
                  onChange={(e) => setDiagnosisForm(prev => ({ ...prev, estimatedTime: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="form-group">
                <label>Valor Total (R$)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={diagnosisForm.value}
                  onChange={(e) => setDiagnosisForm(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="form-group">
                <label>Observações</label>
                <textarea
                  rows={3}
                  value={diagnosisForm.notes}
                  onChange={(e) => setDiagnosisForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <button className="btn-primary" onClick={handleSaveDiagnosis} disabled={savingDiagnosis}>
                {savingDiagnosis ? 'Salvando...' : 'Salvar Diagnóstico'}
              </button>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="tab-pane">
              <h3>Checklist do Veículo</h3>
              {checklistLoading ? (
                <p>Carregando checklist...</p>
              ) : (
                <>
                  <div className="checklist-meta-grid">
                    <div className="form-group">
                      <label>Quilometragem</label>
                      <input
                        type="number" min="0"
                        value={checklist.mileage}
                        onChange={(e) => handleChecklistChange('mileage', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Nível de Combustível</label>
                      <select value={checklist.fuelLevel} onChange={(e) => handleChecklistChange('fuelLevel', e.target.value)}>
                        <option value="">Selecione</option>
                        <option value="Vazio">Vazio</option>
                        <option value="1/4">1/4</option>
                        <option value="1/2">1/2</option>
                        <option value="3/4">3/4</option>
                        <option value="Cheio">Cheio</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Nível de Óleo do Motor</label>
                      <select value={checklist.oilLevel} onChange={(e) => handleChecklistChange('oilLevel', e.target.value)}>
                        <option value="">Selecione</option>
                        <option value="Baixo">Baixo</option>
                        <option value="Normal">Normal</option>
                        <option value="Alto">Alto</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Nível de Óleo de Direção</label>
                      <select value={checklist.steeringFluidLevel} onChange={(e) => handleChecklistChange('steeringFluidLevel', e.target.value)}>
                        <option value="">Selecione</option>
                        <option value="Baixo">Baixo</option>
                        <option value="OK">OK</option>
                        <option value="Vencido por tempo de uso">Vencido por tempo de uso</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Condição dos Pneus</label>
                      <input
                        type="text" placeholder="Ex: Bom estado, desgaste irregular..."
                        value={checklist.tireCondition}
                        onChange={(e) => handleChecklistChange('tireCondition', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Calibragem dos Pneus</label>
                      <input
                        type="text" placeholder="Ex: 32 PSI"
                        value={checklist.tirePressure}
                        onChange={(e) => handleChecklistChange('tirePressure', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Nível de Arrefecimento</label>
                      <select value={checklist.coolingLevel} onChange={(e) => handleChecklistChange('coolingLevel', e.target.value)}>
                        <option value="">Selecione</option>
                        <option value="Baixo">Baixo</option>
                        <option value="Normal">Normal</option>
                        <option value="Alto">Alto</option>
                      </select>
                    </div>
                  </div>

                  <div className="checklist-section">
                    <h4>Itens do Veículo</h4>
                    <div className="checklist-items">
                      {checklistBooleanFields.map(({ key, label }) => (
                        <label key={key} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={!!checklist[key]}
                            onChange={(e) => handleChecklistChange(key, e.target.checked)}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Estado Geral</label>
                    <input
                      type="text"
                      value={checklist.generalState}
                      onChange={(e) => handleChecklistChange('generalState', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Avarias Visuais</label>
                    <textarea
                      rows={2}
                      value={checklist.visualDamage}
                      onChange={(e) => handleChecklistChange('visualDamage', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Observações</label>
                    <textarea
                      rows={3}
                      value={checklist.observations}
                      onChange={(e) => handleChecklistChange('observations', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Mecânico Responsável</label>
                    <input
                      type="text"
                      value={checklist.responsibleUser}
                      onChange={(e) => handleChecklistChange('responsibleUser', e.target.value)}
                      placeholder="Nome do mecânico responsável"
                    />
                  </div>

                  <button className="btn-primary" onClick={handleSaveChecklist} disabled={savingChecklist}>
                    {savingChecklist ? 'Salvando...' : 'Salvar Checklist'}
                  </button>
                </>
              )}
            </div>
          )}

          {activeTab === 'fotos' && (
            <div className="tab-pane">
              <h3>Fotos do Veículo</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoCapture}
                style={{ display: 'none' }}
              />
              <button className="btn-add-photo" onClick={() => fileInputRef.current?.click()}>
                + Adicionar Foto
              </button>

              {photos.length > 0 && (
                <div className="os-photo-grid">
                  {photos.map((photo, index) => (
                    <div key={index} className="os-photo-item">
                      <img src={photo} alt={`Foto ${index + 1}`} />
                      <button type="button" className="os-photo-remove" onClick={() => removePhoto(index)}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              <button className="btn-primary" onClick={handleSavePhotos} disabled={savingPhotos} style={{ marginTop: 20 }}>
                {savingPhotos ? 'Salvando...' : 'Salvar Fotos'}
              </button>
            </div>
          )}

          {activeTab === 'pecas' && (
            <div className="tab-pane">
              <h3>Peças e Insumos Usados</h3>
              <p className="tab-hint">Ao concluir a OS (status "Entregue"), as quantidades são debitadas do estoque automaticamente.</p>

              <div className="item-search-bar">
                <input
                  type="text"
                  placeholder="Buscar peça por código ou descrição..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchItems()}
                />
                <button className="btn-secondary" onClick={handleSearchItems} disabled={searchingItems}>
                  {searchingItems ? 'Buscando...' : 'Buscar'}
                </button>
              </div>

              {itemResults.length > 0 && (
                <div className="item-search-results">
                  {itemResults.map(result => (
                    <div key={result.id} className="item-search-row">
                      <span>{result.code} — {result.description}</span>
                      <span className="item-search-stock">Estoque: {result.quantity}</span>
                      <input
                        type="number" min="1" defaultValue={1}
                        onChange={(e) => setItemQuantities(prev => ({ ...prev, [result.id]: parseInt(e.target.value) || 1 }))}
                      />
                      <button className="btn-primary" onClick={() => handleAddItem(result.id)}>Adicionar</button>
                    </div>
                  ))}
                </div>
              )}

              <table className="data-table" style={{ marginTop: 20 }}>
                <thead>
                  <tr><th>Código</th><th>Descrição</th><th>Qtd</th><th>Valor Unit.</th><th>Total</th><th></th></tr>
                </thead>
                <tbody>
                  {serviceOrder.items.map(item => (
                    <tr key={item.id}>
                      <td>{item.itemCode}</td>
                      <td>{item.itemDescription}</td>
                      <td>{item.quantity}</td>
                      <td>R$ {item.unitValue.toFixed(2)}</td>
                      <td>R$ {item.totalValue.toFixed(2)}</td>
                      <td>
                        <button className="btn-sm btn-danger" onClick={() => handleRemoveItem(item.id)}>Remover</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {serviceOrder.items.length === 0 && <p className="tab-hint">Nenhuma peça lançada ainda.</p>}
            </div>
          )}

          {activeTab === 'historico' && (
            <div className="tab-pane">
              <h3>Histórico de Alterações</h3>
              <div className="timeline">
                {serviceOrder.history
                  .slice()
                  .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
                  .map(entry => (
                    <div className="timeline-item" key={entry.id}>
                      <div className="timeline-time">
                        {new Date(entry.changedAt).toLocaleString('pt-BR')}
                      </div>
                      <div className="timeline-content">
                        <strong>{entry.status}</strong>
                        <p>{entry.notes} {entry.changedBy ? `— ${entry.changedBy}` : ''}</p>
                      </div>
                    </div>
                  ))}
                {serviceOrder.history.length === 0 && <p className="tab-hint">Sem histórico registrado.</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      <ServiceOrderPrintView
        order={serviceOrder}
        checklist={serviceOrder.hasChecklist ? checklist : null}
        checklistBooleanFields={checklistBooleanFields}
      />
    </div>
  );
};

export default ServiceOrderDetails;
