import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/towQuote/towApi';
import type { ServiceOrder, TripExpense } from '../utils/towQuote/types';
import { formatCurrency, formatDateTime } from '../utils/towQuote/pdfKit';
import { TRIP_COSTS_PATH, TRIP_COST_CATEGORIES, tripCostIcon } from '../utils/towQuote/tripCosts';
import '../styles/TowQuoteEditor.css';
import '../styles/TripCosts.css';

// Cliente, placa e carro primeiro: é como a equipe identifica a viagem. OS de
// guincho pode estar sem veículo ainda (preenchido no local da remoção).
const orderLabel = (order: ServiceOrder) => {
  const car = [order.vehicleBrand, order.vehicleModel].map((part) => part?.trim()).filter(Boolean).join(' ');
  return [
    order.customerName?.trim() || 'Cliente não informado',
    order.vehiclePlate?.trim() || 'Placa a definir',
    car,
    order.number,
  ].filter(Boolean).join(' · ');
};

// Lançamento dos custos de cada viagem do guincho (abastecimento, pedágio...),
// igual à tela "Custos Viagem" do app da equipe.
const TripCosts: React.FC = () => {
  const [towOrders, setTowOrders] = useState<ServiceOrder[]>([]);
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const [orderId, setOrderId] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  const [filterOrderId, setFilterOrderId] = useState('');

  useEffect(() => {
    api.get<ServiceOrder[]>('/service-orders')
      .then((orders) => setTowOrders(orders.filter((o) => o.serviceType === 'Guincho' && o.status !== 'Cancelado')))
      .catch((error) => console.error('Erro ao carregar OS de guincho:', error));
  }, []);

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterOrderId]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const query = filterOrderId ? `?serviceOrderId=${filterOrderId}` : '';
      setExpenses(await api.get<TripExpense[]>(`/trip-expenses${query}`));
    } catch (error) {
      console.error('Erro ao carregar custos:', error);
    } finally {
      setLoading(false);
    }
  };

  const choosePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhoto((prev) => {
      if (prev) URL.revokeObjectURL(prev.preview);
      return { file, preview: URL.createObjectURL(file) };
    });
  };

  const clearPhoto = () => {
    setPhoto((prev) => {
      if (prev) URL.revokeObjectURL(prev.preview);
      return null;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      alert('Escolha a categoria do custo.');
      return;
    }
    if (!amount || Number(amount.replace(',', '.')) <= 0) {
      alert('Informe o valor.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('amount', amount);
      formData.append('description', description);
      if (orderId) formData.append('serviceOrderId', orderId);
      if (photo) formData.append('photo', photo.file);

      const created = await api.post<TripExpense>('/trip-expenses', formData);
      if (!filterOrderId || filterOrderId === created.serviceOrderId) {
        setExpenses((prev) => [created, ...prev]);
      }

      // Mantém a OS escolhida para lançar vários custos da mesma viagem em sequência.
      setCategory('');
      setAmount('');
      setDescription('');
      clearPhoto();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao salvar custo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (expense: TripExpense) => {
    if (!window.confirm(`Excluir ${expense.category} de ${formatCurrency(expense.amount)}?`)) return;
    setDeletingId(expense.id);
    try {
      await api.delete(`/trip-expenses/${expense.id}`);
      setExpenses((prev) => prev.filter((item) => item.id !== expense.id));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao excluir custo.');
    } finally {
      setDeletingId(null);
    }
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalsByCategory = useMemo(
    () =>
      TRIP_COST_CATEGORIES.map((c) => ({
        ...c,
        total: expenses.filter((e) => e.category === c.value).reduce((sum, e) => sum + e.amount, 0),
      })).filter((c) => c.total > 0),
    [expenses]
  );

  return (
    <div className="checkin-page tq-editor trip-costs-page">
      <div className="page-header">
        <h2>🛣️ Custos de Viagem</h2>
        <Link to={`${TRIP_COSTS_PATH}/consultar`} className="btn-link">Consultar por viagem →</Link>
      </div>

      <form className="freight-quote-box" onSubmit={handleSave}>
        <h3>Novo lançamento</h3>

        <div className="form-group">
          <label>OS de guincho (opcional)</label>
          <select value={orderId} onChange={(e) => setOrderId(e.target.value)}>
            <option value="">Sem vínculo (avulso)</option>
            {towOrders.map((order) => (
              <option key={order.id} value={order.id}>{orderLabel(order)}</option>
            ))}
          </select>
        </div>

        <div className="form-group cost-amount-field">
          <label>Valor (R$)</label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <label className="field-label">Categoria</label>
        <div className="cost-categories" role="group" aria-label="Categoria do custo">
          {TRIP_COST_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              className={category === c.value ? 'cost-category active' : 'cost-category'}
              aria-pressed={category === c.value}
              onClick={() => setCategory(c.value)}
            >
              <span aria-hidden="true">{c.icon}</span>
              {c.value}
            </button>
          ))}
        </div>

        <label className="field-label">Foto do comprovante</label>
        <div className="cost-photo">
          {photo ? (
            <div className="pending-photo">
              <img src={photo.preview} alt="Comprovante" />
              <button type="button" className="pending-photo-remove" onClick={clearPhoto} aria-label="Remover foto">✕</button>
            </div>
          ) : (
            <span className="cost-photo-empty">Sem foto</span>
          )}
          <input ref={photoInput} type="file" accept="image/*" onChange={choosePhoto} hidden />
          <button type="button" className="btn-secondary" onClick={() => photoInput.current?.click()} disabled={saving}>
            🖼️ Escolher foto
          </button>
        </div>

        <div className="form-group">
          <label>Descrição do problema ou imprevisto</label>
          <textarea
            rows={3}
            placeholder={category === 'Manutenção imprevisto' ? 'O que aconteceu e o que foi feito' : 'Opcional'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button type="submit" className="btn-primary btn-generate-pdf" style={{ marginTop: 4 }} disabled={saving}>
          {saving ? 'Salvando...' : '💾 Salvar custo'}
        </button>
      </form>

      <h3 style={{ marginTop: 22 }}>Lançamentos</h3>
      <select value={filterOrderId} onChange={(e) => setFilterOrderId(e.target.value)} aria-label="Filtrar lançamentos por OS">
        <option value="">Todos os lançamentos</option>
        {towOrders.map((order) => (
          <option key={order.id} value={order.id}>{orderLabel(order)}</option>
        ))}
      </select>

      <div className="cost-summary">
        <div className="cost-summary-total">
          <small>Total</small>
          <strong>{formatCurrency(total)}</strong>
        </div>
        {totalsByCategory.map((c) => (
          <span key={c.value} className="cost-summary-chip">
            {c.icon} {c.value}: <strong>{formatCurrency(c.total)}</strong>
          </span>
        ))}
      </div>

      {loading && <p className="hint">Carregando...</p>}
      {!loading && expenses.length === 0 && <p className="hint">Nenhum custo lançado.</p>}

      <div className="order-list">
        {expenses.map((expense) => (
          <div key={expense.id} className="order-card cost-card">
            <div className="order-card-top">
              <strong>{tripCostIcon(expense.category)} {expense.category}</strong>
              <strong className="cost-amount">{formatCurrency(expense.amount)}</strong>
            </div>
            <div className="cost-card-body">
              {expense.photoUrl && (
                <a href={expense.photoUrl} target="_blank" rel="noreferrer">
                  <img src={expense.photoUrl} alt="Comprovante" className="cost-thumb" />
                </a>
              )}
              <div className="cost-card-info">
                {expense.description && <p>{expense.description}</p>}
                <p className="hint">
                  {formatDateTime(expense.createdAt)} · {expense.createdBy}
                  {expense.serviceOrderNumber && ` · ${expense.serviceOrderNumber} (${expense.vehiclePlate})`}
                </p>
              </div>
              <button
                type="button"
                className="route-step-remove"
                onClick={() => handleDelete(expense)}
                disabled={deletingId === expense.id}
                aria-label="Excluir lançamento"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TripCosts;
