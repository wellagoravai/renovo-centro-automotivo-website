import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/towQuote/towApi';
import type { ServiceOrder, TripExpense } from '../utils/towQuote/types';
import { formatCurrency, formatDate, formatDateTime } from '../utils/towQuote/pdfKit';
import { buildTripReport, PERIODS, type PeriodKey } from '../utils/towQuote/tripReport';
import { TRIP_COSTS_PATH, tripCostIcon } from '../utils/towQuote/tripCosts';
import '../styles/TowQuoteEditor.css';
import '../styles/TripCosts.css';

const km = (value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;

// Consulta dos custos de cada viagem (OS de guincho): custos lançados x valor
// cobrado, com o detalhe de cada lançamento.
const TripCostsReport: React.FC = () => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([api.get<ServiceOrder[]>('/service-orders'), api.get<TripExpense[]>('/trip-expenses')])
      .then(([allOrders, allExpenses]) => {
        setOrders(allOrders.filter((o) => o.serviceType === 'Guincho' && o.status !== 'Cancelado'));
        setExpenses(allExpenses);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar os custos.'))
      .finally(() => setLoading(false));
  }, []);

  const report = useMemo(
    () => buildTripReport(orders, expenses, period, search, new Date()),
    [orders, expenses, period, search]
  );

  return (
    <div className="checkin-page tq-editor trip-costs-page trip-report-page">
      <div className="page-header">
        <h2>📊 Custos por viagem</h2>
        <Link to={TRIP_COSTS_PATH} className="btn-link">+ Lançar custo</Link>
      </div>

      <div className="filter-chips" role="group" aria-label="Período">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={period === p.key ? 'filter-chip active' : 'filter-chip'}
            aria-pressed={period === p.key}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <input
        type="search"
        style={{ marginTop: 10 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nº da OS, placa ou cliente"
        aria-label="Buscar viagem"
      />

      <div className="cost-summary">
        <div className="cost-summary-total">
          <small>Custos no período · {report.trips.length} {report.trips.length === 1 ? 'viagem' : 'viagens'}</small>
          <strong>{formatCurrency(report.totalCosts)}</strong>
        </div>
        <span className="cost-summary-chip">Cobrado: <strong>{formatCurrency(report.totalRevenue)}</strong></span>
        <span className="cost-summary-chip">
          Resultado: <strong className={report.totalRevenue - report.totalCosts < 0 ? 'trip-negative' : 'trip-positive'}>
            {formatCurrency(report.totalRevenue - report.totalCosts)}
          </strong>
        </span>
        {report.byCategory.map((c) => (
          <span key={c.category} className="cost-summary-chip">
            {tripCostIcon(c.category)} {c.category}: <strong>{formatCurrency(c.total)}</strong>
          </span>
        ))}
      </div>

      {loading && <p className="hint">Carregando...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && report.trips.length === 0 && report.looseExpenses.length === 0 && (
        <p className="hint">Nenhuma viagem ou custo neste período.</p>
      )}

      <div className="order-list">
        {report.trips.map((trip) => {
          const result = trip.revenue !== null ? trip.revenue - trip.costs : null;
          return (
            <details key={trip.id} className="order-card cost-card trip-card">
              <summary>
                <div className="order-card-top">
                  <strong>{trip.number}{trip.plate && ` · ${trip.plate}`}</strong>
                  <strong className="cost-amount">{formatCurrency(trip.costs)}</strong>
                </div>
                <p className="hint">
                  {[trip.date && formatDate(trip.date), trip.customer, trip.route].filter(Boolean).join(' · ')}
                </p>
                <div className="trip-figures">
                  <span>Cobrado: <strong>{trip.revenue !== null ? formatCurrency(trip.revenue) : '—'}</strong></span>
                  <span>
                    Resultado:{' '}
                    <strong className={result !== null && result < 0 ? 'trip-negative' : 'trip-positive'}>
                      {result !== null ? formatCurrency(result) : '—'}
                    </strong>
                  </span>
                  {trip.km !== null && (
                    <span>
                      {km(trip.km)}{trip.kmSource === 'truck' ? ' rodados' : ' (rota)'}
                      {trip.costs > 0 && trip.km > 0 && ` · ${formatCurrency(trip.costs / trip.km)}/km`}
                    </span>
                  )}
                  <span>{trip.expenses.length} {trip.expenses.length === 1 ? 'lançamento' : 'lançamentos'}</span>
                </div>
              </summary>

              <ExpenseList expenses={trip.expenses} />
              {trip.orderExists && (
                <Link to={`/service-orders/${trip.id}`} className="btn-link trip-open-order">Abrir OS</Link>
              )}
            </details>
          );
        })}

        {report.looseExpenses.length > 0 && (
          <details className="order-card cost-card trip-card">
            <summary>
              <div className="order-card-top">
                <strong>Sem OS (avulsos)</strong>
                <strong className="cost-amount">
                  {formatCurrency(report.looseExpenses.reduce((sum, e) => sum + e.amount, 0))}
                </strong>
              </div>
              <p className="hint">{report.looseExpenses.length} lançamentos sem viagem vinculada</p>
            </summary>
            <ExpenseList expenses={report.looseExpenses} />
          </details>
        )}
      </div>
    </div>
  );
};

const ExpenseList: React.FC<{ expenses: TripExpense[] }> = ({ expenses }) =>
  expenses.length === 0 ? (
    <p className="hint">Nenhum custo lançado nesta viagem.</p>
  ) : (
    <ul className="trip-expense-list">
      {expenses.map((expense) => (
        <li key={expense.id}>
          <div className="order-card-top">
            <span>{tripCostIcon(expense.category)} {expense.category}</span>
            <strong>{formatCurrency(expense.amount)}</strong>
          </div>
          {expense.description && <p>{expense.description}</p>}
          <p className="hint">
            {formatDateTime(expense.createdAt)} · {expense.createdBy}
            {expense.photoUrl && (
              <> · <a href={expense.photoUrl} target="_blank" rel="noreferrer">comprovante</a></>
            )}
          </p>
        </li>
      ))}
    </ul>
  );

export default TripCostsReport;
