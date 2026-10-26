import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { FORKLIFT_QUOTES_PATH, isForkliftQuote, quotePath, TOW_QUOTES_PATH } from '../utils/towQuote/quoteKind';
import type { TowQuote, TowQuoteStatus } from '../utils/towQuote/types';
import '../styles/TowQuotes.css';

type StatusFilter = 'todos' | TowQuoteStatus;
type KindFilter = 'todos' | 'guincho' | 'empilhadeira';

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

const kindOptions: { value: KindFilter; label: string }[] = [
  { value: 'todos', label: 'Todos os tipos' },
  { value: 'guincho', label: '🚛 Guincho' },
  { value: 'empilhadeira', label: '🏗️ Empilhadeira' },
];

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (value: string) => new Date(value).toLocaleDateString('pt-BR');
const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const matchesKind = (quote: TowQuote, kind: KindFilter) =>
  kind === 'todos' || (kind === 'empilhadeira') === isForkliftQuote(quote);

// Histórico dos orçamentos de guincho e de empilhadeira (feitos aqui ou pelo app
// da equipe): acompanhar os pendentes, ver quais viraram OS e baixar o PDF
// enviado ao cliente. Clicar num orçamento reabre o formulário preenchido.
const TowQuotes: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('orders.write');

  const [quotes, setQuotes] = useState<TowQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  // Tipo na URL: o menu lateral abre a lista já filtrada (?tipo=empilhadeira).
  const [searchParams, setSearchParams] = useSearchParams();
  const kindParam = searchParams.get('tipo');
  const kindFilter: KindFilter = kindOptions.some(o => o.value === kindParam) ? (kindParam as KindFilter) : 'todos';

  const setKindFilter = (kind: KindFilter) => {
    const next = new URLSearchParams(searchParams);
    if (kind === 'todos') next.delete('tipo');
    else next.set('tipo', kind);
    setSearchParams(next, { replace: true });
  };

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

  const ofKind = useMemo(() => quotes.filter(q => matchesKind(q, kindFilter)), [quotes, kindFilter]);

  const searched = useMemo(() => {
    const term = normalize(search.trim());
    if (!term) return ofKind;
    return ofKind.filter(q =>
      [q.number, q.customerName, q.vehiclePlate, q.vehicleDescription, q.routeSummary].some(f => normalize(f || '').includes(term))
    );
  }, [ofKind, search]);

  const visible = statusFilter === 'todos' ? searched : searched.filter(q => q.status === statusFilter);

  const stats = useMemo(() => {
    const by = (status: TowQuoteStatus) => ofKind.filter(q => q.status === status);
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
  }, [ofKind]);

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

  const deleteQuote = async (quote: TowQuote) => {
    if (!window.confirm(`Excluir o orçamento ${quote.number}? Esta ação não pode ser desfeita.`)) return;
    setBusyId(quote.id);
    try {
      const response = await api.delete(`/tow-quotes/${quote.id}`);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message);
      }
      setQuotes(prev => prev.filter(q => q.id !== quote.id));
    } catch (err) {
      alert(`❌ ${err instanceof Error && err.message ? err.message : 'Não foi possível excluir o orçamento.'}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="tow-quotes-page">
      <div className="page-header">
        <div>
          <h1>🗂️ Orçamentos salvos</h1>
          <p className="tq-subtitle">Guincho e empilhadeira, feitos aqui ou pelo app da equipe. Ao aprovar, o orçamento vira OS de guincho.</p>
        </div>
        <div className="tq-header-actions">
          <button className="btn btn-secondary" onClick={loadQuotes} disabled={loading}>
            ↻ Atualizar
          </button>
          {canWrite && (
            <>
              <Link to={`${TOW_QUOTES_PATH}/novo`} className="btn btn-primary">
                + Guincho
              </Link>
              <Link to={`${FORKLIFT_QUOTES_PATH}/novo`} className="btn btn-primary">
                + Empilhadeira
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="tq-chips tq-kind-chips" role="group" aria-label="Filtrar por tipo">
        {kindOptions.map(option => (
          <button
            key={option.value}
            type="button"
            className={kindFilter === option.value ? 'tq-chip active' : 'tq-chip'}
            aria-pressed={kindFilter === option.value}
            onClick={() => setKindFilter(option.value)}
          >
            {option.label}
            <span className="tq-chip-count">{quotes.filter(q => matchesKind(q, option.value)).length}</span>
          </button>
        ))}
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
                <th>Veículo / equipamento</th>
                <th>Rota / locação</th>
                <th className="tq-num">Total</th>
                <th>Situação</th>
                <th>OS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(quote => (
                <tr key={quote.id} className="tq-row" onClick={() => navigate(quotePath(quote))}>
                  <td className="tq-mono" title={isForkliftQuote(quote) ? 'Empilhadeira' : 'Guincho'}>
                    {isForkliftQuote(quote) ? '🏗️' : '🚛'} {quote.number}
                  </td>
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
                  <td className="tq-row-actions" onClick={e => e.stopPropagation()}>
                    {/* OS de guincho só nasce do orçamento: o botão de aprovar no
                        formulário abre a OS já preenchida com os dados dele. */}
                    {canWrite && quote.status === 'Pendente' && !quote.serviceOrderId && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => navigate(`${quotePath(quote)}#aprovar`)}
                        title="Cliente aprovou: abrir a OS com os dados do orçamento"
                      >
                        ✅ Criar OS
                      </button>
                    )}
                    {quote.hasPdf && (
                      <button className="btn btn-sm btn-primary" onClick={() => downloadPdf(quote)}>
                        PDF
                      </button>
                    )}
                    {canWrite && quote.status !== 'Aprovado' && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteQuote(quote)}
                        disabled={busyId === quote.id}
                        title="Excluir orçamento"
                        aria-label={`Excluir orçamento ${quote.number}`}
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && (
            <div className="empty-state">
              <p>{ofKind.length === 0 ? 'Nenhum orçamento salvo ainda. Eles aparecem aqui quando o PDF é gerado.' : 'Nenhum orçamento para este filtro.'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TowQuotes;
