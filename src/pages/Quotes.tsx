import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/Quotes.css';

export interface QuoteSummary {
  id: string;
  number: string;
  status: string;
  entryDate: string;
  customerName: string;
  customerWhatsApp: string;
  vehiclePlate: string;
  vehicleDescription: string;
  itemsCount: number;
  partsTotal: number;
  laborValue: number;
  discount: number;
  total: number;
  quoteSentAt?: string | null;
}

type Filter = 'todos' | 'montar' | 'enviados';

export const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (value: string) => new Date(value).toLocaleDateString('pt-BR');

const filterOptions: { value: Filter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'montar', label: 'A enviar' },
  { value: 'enviados', label: 'Enviados' },
];

// Lista as OS de oficina em aberto para montar o orçamento (peças, mão de obra,
// desconto e fotos), imprimir o PDF ou enviar ao cliente pelo WhatsApp.
const Quotes: React.FC = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('todos');
  const [includeClosed, setIncludeClosed] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/quotes?includeClosed=${includeClosed}`);
        if (!response.ok) throw new Error();
        setQuotes(await response.json());
      } catch {
        setError('Não foi possível carregar os orçamentos.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [includeClosed]);

  const searched = useMemo(() => {
    const term = search.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    if (!term) return quotes;
    return quotes.filter(q =>
      [q.number, q.customerName, q.vehiclePlate, q.vehicleDescription]
        .some(f => (f || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(term))
    );
  }, [quotes, search]);

  const matches = (q: QuoteSummary, f: Filter) =>
    f === 'todos' || (f === 'enviados' ? !!q.quoteSentAt : !q.quoteSentAt);

  const visible = searched.filter(q => matches(q, filter));

  return (
    <div className="quotes-page">
      <div className="page-header">
        <div>
          <h1>💰 Orçamentos</h1>
          <p className="qt-subtitle">Monte o orçamento da OS, imprima o PDF ou envie direto para o WhatsApp do cliente.</p>
        </div>
      </div>

      <div className="qt-toolbar">
        <div className="qt-chips" role="group" aria-label="Filtrar orçamentos">
          {filterOptions.map(option => (
            <button
              key={option.value}
              type="button"
              className={filter === option.value ? 'qt-chip active' : 'qt-chip'}
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
              <span className="qt-chip-count">{searched.filter(q => matches(q, option.value)).length}</span>
            </button>
          ))}
          <label className="qt-closed-toggle">
            <input type="checkbox" checked={includeClosed} onChange={e => setIncludeClosed(e.target.checked)} />
            Mostrar entregues/cancelados
          </label>
        </div>
        <input
          className="form-control qt-search"
          placeholder="Buscar por nº da OS, cliente, placa ou modelo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading && <div className="loading">Carregando...</div>}
      {error && <div className="qt-error">{error}</div>}

      {!loading && !error && (
        <div className="qt-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>OS</th>
                <th>Entrada</th>
                <th>Cliente</th>
                <th>Veículo</th>
                <th>Status</th>
                <th className="qt-num">Total</th>
                <th>Orçamento</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(quote => (
                <tr key={quote.id} className="qt-row" onClick={() => navigate(`/orcamentos/${quote.id}`)}>
                  <td className="qt-mono">{quote.number}</td>
                  <td>{formatDate(quote.entryDate)}</td>
                  <td>{quote.customerName || '—'}</td>
                  <td>{[quote.vehiclePlate, quote.vehicleDescription].filter(Boolean).join(' · ') || '—'}</td>
                  <td><span className="qt-status">{quote.status}</span></td>
                  <td className="qt-num">
                    {formatCurrency(quote.total)}
                    {quote.discount > 0 && <small className="qt-discount">− {formatCurrency(quote.discount)} desc.</small>}
                  </td>
                  <td>
                    {quote.quoteSentAt
                      ? <span className="qt-badge sent">Enviado {formatDate(quote.quoteSentAt)}</span>
                      : <span className="qt-badge pending">{quote.itemsCount > 0 || quote.laborValue > 0 ? 'A enviar' : 'Montar'}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && (
            <div className="empty-state">
              <p>{quotes.length === 0 ? 'Nenhuma OS de oficina em aberto.' : 'Nenhum orçamento para este filtro.'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Quotes;
