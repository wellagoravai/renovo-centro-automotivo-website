import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import '../styles/TowQuotes.css';

type TowQuoteStatus = 'Pendente' | 'Aprovado' | 'Recusado';

interface TowQuote {
  id: string;
  number: string;
  status: TowQuoteStatus;
  customerName: string;
  customerPhone: string;
  vehiclePlate: string;
  vehicleDescription: string;
  routeSummary: string;
  totalKm: number | null;
  total: number;
  hasPdf: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  decidedAt?: string | null;
  decidedBy?: string | null;
  serviceOrderId?: string | null;
  serviceOrderNumber?: string | null;
  formData?: string;
}

// Formulário salvo pelo app (TowQuote.formData). Só os campos exibidos no detalhe.
interface QuoteFormData {
  assistance?: Record<string, string>;
  service?: Record<string, string>;
  paymentTerms?: string;
  invoice?: Record<string, string>;
  notes?: string;
}

type StatusFilter = 'todos' | TowQuoteStatus;

const statusColors: Record<TowQuoteStatus, string> = {
  Pendente: '#e67e22',
  Aprovado: '#27ae60',
  Recusado: '#7f8c8d',
};

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'Pendente', label: 'Pendentes' },
  { value: 'Aprovado', label: 'Aprovados' },
  { value: 'Recusado', label: 'Recusados' },
];

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (value: string) => new Date(value).toLocaleDateString('pt-BR');
const formatDateTime = (value: string) => new Date(value).toLocaleString('pt-BR');
const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const parseFormData = (raw?: string): QuoteFormData => {
  try {
    return raw ? (JSON.parse(raw) as QuoteFormData) : {};
  } catch {
    return {};
  }
};

const DetailRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) =>
  value && value.trim() ? (
    <div className="tq-detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  ) : null;

// Histórico dos orçamentos de guincho feitos pelo app da equipe: acompanhar os
// pendentes, ver quais viraram OS e baixar o PDF enviado ao cliente.
const TowQuotes: React.FC = () => {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('orders.write');

  const [quotes, setQuotes] = useState<TowQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<TowQuote | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/tow-quotes');
      if (!response.ok) throw new Error();
      setQuotes(await response.json());
    } catch {
      setError('Não foi possível carregar os orçamentos.');
    } finally {
      setLoading(false);
    }
  };

  const searched = useMemo(() => {
    const term = normalize(search.trim());
    if (!term) return quotes;
    return quotes.filter(q =>
      [q.number, q.customerName, q.vehiclePlate, q.vehicleDescription, q.routeSummary].some(f => normalize(f || '').includes(term))
    );
  }, [quotes, search]);

  const visible = statusFilter === 'todos' ? searched : searched.filter(q => q.status === statusFilter);

  const stats = useMemo(() => {
    const by = (status: TowQuoteStatus) => quotes.filter(q => q.status === status);
    const sum = (list: TowQuote[]) => list.reduce((acc, q) => acc + q.total, 0);
    const pending = by('Pendente');
    const approved = by('Aprovado');
    const rejected = by('Recusado');
    const decided = approved.length + rejected.length;
    return {
      pending: pending.length,
      pendingValue: sum(pending),
      approved: approved.length,
      approvedValue: sum(approved),
      rejected: rejected.length,
      approvalRate: decided > 0 ? Math.round((approved.length / decided) * 100) : null,
    };
  }, [quotes]);

  const openDetails = async (quote: TowQuote) => {
    setSelected(quote);
    try {
      const response = await api.get(`/tow-quotes/${quote.id}`);
      if (response.ok) setSelected(await response.json());
    } catch {
      // Mantém o resumo da listagem; o detalhe extra é opcional.
    }
  };

  const downloadPdf = async (quote: TowQuote) => {
    try {
      const response = await api.get(`/tow-quotes/${quote.id}/pdf`);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Orcamento-${quote.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('❌ Não foi possível baixar o PDF do orçamento.');
    }
  };

  const replaceQuote = (updated: TowQuote) => {
    setQuotes(prev => prev.map(q => (q.id === updated.id ? { ...q, ...updated } : q)));
    setSelected(prev => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
  };

  const rejectQuote = async (quote: TowQuote) => {
    if (!window.confirm(`Marcar o orçamento ${quote.number} como recusado pelo cliente?`)) return;
    setBusy(true);
    try {
      const response = await api.post(`/tow-quotes/${quote.id}/reject`, {});
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message);
      replaceQuote(body);
    } catch (err) {
      alert(`❌ ${err instanceof Error && err.message ? err.message : 'Não foi possível recusar o orçamento.'}`);
    } finally {
      setBusy(false);
    }
  };

  const deleteQuote = async (quote: TowQuote) => {
    if (!window.confirm(`Excluir o orçamento ${quote.number}? Esta ação não pode ser desfeita.`)) return;
    setBusy(true);
    try {
      const response = await api.delete(`/tow-quotes/${quote.id}`);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message);
      }
      setQuotes(prev => prev.filter(q => q.id !== quote.id));
      setSelected(null);
    } catch (err) {
      alert(`❌ ${err instanceof Error && err.message ? err.message : 'Não foi possível excluir o orçamento.'}`);
    } finally {
      setBusy(false);
    }
  };

  const details = parseFormData(selected?.formData);

  return (
    <div className="tow-quotes-page">
      <div className="page-header">
        <div>
          <h1>🧾 Orçamentos de Guincho</h1>
          <p className="tq-subtitle">Feitos pelo app da equipe. Ao aprovar, o orçamento vira OS de guincho.</p>
        </div>
        <button className="btn btn-secondary" onClick={loadQuotes} disabled={loading}>
          ↻ Atualizar
        </button>
      </div>

      <div className="tq-stats">
        <div className="tq-stat" style={{ borderTopColor: statusColors.Pendente }}>
          <span className="tq-stat-label">Pendentes</span>
          <strong className="tq-stat-value">{stats.pending}</strong>
          <span className="tq-stat-sub">{formatCurrency(stats.pendingValue)} em aberto</span>
        </div>
        <div className="tq-stat" style={{ borderTopColor: statusColors.Aprovado }}>
          <span className="tq-stat-label">Aprovados</span>
          <strong className="tq-stat-value">{stats.approved}</strong>
          <span className="tq-stat-sub">{formatCurrency(stats.approvedValue)} fechados</span>
        </div>
        <div className="tq-stat" style={{ borderTopColor: statusColors.Recusado }}>
          <span className="tq-stat-label">Recusados</span>
          <strong className="tq-stat-value">{stats.rejected}</strong>
          <span className="tq-stat-sub">&nbsp;</span>
        </div>
        <div className="tq-stat">
          <span className="tq-stat-label">Taxa de aprovação</span>
          <strong className="tq-stat-value">{stats.approvalRate === null ? '—' : `${stats.approvalRate}%`}</strong>
          <span className="tq-stat-sub">entre aprovados e recusados</span>
        </div>
      </div>

      <div className="tq-toolbar">
        <div className="tq-chips" role="group" aria-label="Filtrar por situação">
          {statusOptions.map(option => (
            <button
              key={option.value}
              type="button"
              className={statusFilter === option.value ? 'tq-chip active' : 'tq-chip'}
              aria-pressed={statusFilter === option.value}
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
              <span className="tq-chip-count">
                {option.value === 'todos' ? searched.length : searched.filter(q => q.status === option.value).length}
              </span>
            </button>
          ))}
        </div>
        <input
          className="form-control tq-search"
          placeholder="Buscar por nº, cliente, placa ou cidade..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading && <div className="loading">Carregando...</div>}
      {error && <div className="tq-error">{error}</div>}

      {!loading && !error && (
        <div className="tq-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Veículo</th>
                <th>Rota</th>
                <th className="tq-num">Total</th>
                <th>Situação</th>
                <th>OS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(quote => (
                <tr key={quote.id} className="tq-row" onClick={() => openDetails(quote)}>
                  <td className="tq-mono">{quote.number}</td>
                  <td>{formatDate(quote.createdAt)}</td>
                  <td>{quote.customerName || '—'}</td>
                  <td>{[quote.vehiclePlate, quote.vehicleDescription].filter(Boolean).join(' · ') || '—'}</td>
                  <td className="tq-route">{quote.routeSummary || '—'}</td>
                  <td className="tq-num">{formatCurrency(quote.total)}</td>
                  <td>
                    <span className="tq-badge" style={{ backgroundColor: statusColors[quote.status] }}>{quote.status}</span>
                  </td>
                  <td>
                    {quote.serviceOrderId ? (
                      <Link to={`/service-orders/${quote.serviceOrderId}`} onClick={e => e.stopPropagation()}>
                        {quote.serviceOrderNumber ?? 'Ver OS'}
                      </Link>
                    ) : '—'}
                  </td>
                  <td>
                    {quote.hasPdf && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={e => {
                          e.stopPropagation();
                          downloadPdf(quote);
                        }}
                      >
                        PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && (
            <div className="empty-state">
              <p>{quotes.length === 0 ? 'Nenhum orçamento salvo ainda. Eles aparecem aqui quando a equipe gera o PDF pelo app.' : 'Nenhum orçamento para este filtro.'}</p>
            </div>
          )}
        </div>
      )}

      {selected && (
        <div className="tq-modal-overlay" onClick={() => setSelected(null)}>
          <div className="tq-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <div className="tq-modal-header">
              <div>
                <h2>Orçamento {selected.number}</h2>
                <span className="tq-badge" style={{ backgroundColor: statusColors[selected.status] }}>{selected.status}</span>
              </div>
              <button className="tq-modal-close" onClick={() => setSelected(null)} aria-label="Fechar">×</button>
            </div>

            <div className="tq-modal-body">
              <div className="tq-total">
                <span>Total do orçamento</span>
                <strong>{formatCurrency(selected.total)}</strong>
                {selected.totalKm !== null && <small>{selected.totalKm.toLocaleString('pt-BR')} km rodados</small>}
              </div>

              <h3>Cliente e veículo</h3>
              <DetailRow label="Cliente" value={selected.customerName} />
              <DetailRow label="Telefone" value={selected.customerPhone} />
              <DetailRow label="Veículo" value={[selected.vehiclePlate, selected.vehicleDescription].filter(Boolean).join(' · ')} />

              <h3>Serviço</h3>
              <DetailRow label="Rota" value={selected.routeSummary} />
              <DetailRow label="Tipo de guincho" value={details.service?.towType} />
              <DetailRow label="Retirada" value={details.service?.pickupLocation} />
              <DetailRow label="Entrega" value={details.service?.deliveryDestination} />
              <DetailRow label="Seguradora" value={details.assistance?.insuranceCompany} />
              <DetailRow label="Assistência" value={details.assistance?.assistanceCompany} />
              <DetailRow label="Protocolo" value={details.assistance?.protocol} />
              <DetailRow label="Sinistro" value={details.assistance?.claimNumber} />
              <DetailRow label="Pagamento" value={details.paymentTerms} />
              <DetailRow label="Nota fiscal para" value={[details.invoice?.name, details.invoice?.document].filter(Boolean).join(' · ')} />
              {details.notes && details.notes.trim() && <p className="tq-notes">{details.notes}</p>}

              <h3>Histórico</h3>
              <DetailRow label="Criado" value={`${formatDateTime(selected.createdAt)} · ${selected.createdBy}`} />
              <DetailRow label="Última alteração" value={formatDateTime(selected.updatedAt)} />
              {selected.decidedAt && (
                <DetailRow
                  label={selected.status === 'Aprovado' ? 'Aprovado' : 'Recusado'}
                  value={`${formatDateTime(selected.decidedAt)}${selected.decidedBy ? ` · ${selected.decidedBy}` : ''}`}
                />
              )}
              {selected.serviceOrderId && (
                <div className="tq-detail-row">
                  <span>OS aberta</span>
                  <Link to={`/service-orders/${selected.serviceOrderId}`}>{selected.serviceOrderNumber ?? 'Ver OS'}</Link>
                </div>
              )}
              <p className="tq-hint">Para editar ou aprovar, abra o orçamento em “Orçamentos salvos” no app da equipe.</p>
            </div>

            <div className="tq-modal-footer">
              {canWrite && selected.status === 'Pendente' && (
                <button className="btn btn-secondary" onClick={() => rejectQuote(selected)} disabled={busy}>
                  Cliente recusou
                </button>
              )}
              {canWrite && selected.status !== 'Aprovado' && (
                <button className="btn btn-danger" onClick={() => deleteQuote(selected)} disabled={busy}>
                  Excluir
                </button>
              )}
              {selected.hasPdf && (
                <button className="btn btn-primary" onClick={() => downloadPdf(selected)}>
                  Baixar PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TowQuotes;
