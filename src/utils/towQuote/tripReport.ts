import type { ServiceOrder, TripExpense } from './types';

export type PeriodKey = 'month' | 'lastMonth' | '90d' | 'all';

export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'month', label: 'Este mês' },
  { key: 'lastMonth', label: 'Mês passado' },
  { key: '90d', label: 'Últimos 90 dias' },
  { key: 'all', label: 'Tudo' },
];

export interface TripSummary {
  id: string;
  number: string;
  plate: string;
  customer: string;
  date: string | null;
  route: string;
  // Valor cobrado do cliente (frete da OS); null quando a OS não tem valor.
  revenue: number | null;
  costs: number;
  // KM do hodômetro do caminhão (saída/chegada) ou, sem ele, a distância da rota.
  km: number | null;
  kmSource: 'truck' | 'route' | null;
  expenses: TripExpense[];
  // false quando só há lançamentos de uma OS que não veio na lista (ex.: cancelada).
  orderExists: boolean;
}

export interface TripReport {
  trips: TripSummary[];
  looseExpenses: TripExpense[];
  totalCosts: number;
  totalRevenue: number;
  byCategory: { category: string; total: number }[];
}

function periodRange(period: PeriodKey, now: Date): [Date, Date] | null {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (period) {
    case 'month':
      return [new Date(y, m, 1), new Date(y, m + 1, 1)];
    case 'lastMonth':
      return [new Date(y, m - 1, 1), new Date(y, m, 1)];
    case '90d':
      return [new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), new Date(now.getTime() + 1)];
    default:
      return null;
  }
}

const sum = (expenses: TripExpense[]) => Math.round(expenses.reduce((total, e) => total + e.amount, 0) * 100) / 100;

const place = (city?: string | null, uf?: string | null) => [city?.trim(), uf].filter(Boolean).join('/');

// Uma viagem entra no período pela data da OS ou por ter custo lançado nele; os
// custos mostrados são todos os da viagem, para o resultado dela fechar.
export function buildTripReport(
  orders: ServiceOrder[],
  expenses: TripExpense[],
  period: PeriodKey,
  search: string,
  now: Date
): TripReport {
  const range = periodRange(period, now);
  const inRange = (value?: string | null) => {
    if (!range) return true;
    if (!value) return false;
    const date = new Date(value);
    return date >= range[0] && date < range[1];
  };

  const byOrder = new Map<string, TripExpense[]>();
  const looseAll: TripExpense[] = [];
  for (const expense of expenses) {
    if (!expense.serviceOrderId) {
      looseAll.push(expense);
      continue;
    }
    const list = byOrder.get(expense.serviceOrderId) ?? [];
    list.push(expense);
    byOrder.set(expense.serviceOrderId, list);
  }

  const trips: TripSummary[] = orders.map((order) => {
    const tow = order.towDetails;
    const truckKm = tow?.truckStartKm != null && tow?.truckEndKm != null && tow.truckEndKm > tow.truckStartKm
      ? tow.truckEndKm - tow.truckStartKm
      : null;
    const routeKm = tow?.distanceKm ?? null;
    const origin = place(tow?.originCity, tow?.originState);
    const destination = place(tow?.destinationCity, tow?.destinationState);
    const revenue = tow?.freightTotal ?? (order.value > 0 ? order.value : null);
    const tripExpenses = byOrder.get(order.id) ?? [];
    byOrder.delete(order.id);
    return {
      id: order.id,
      number: order.number,
      plate: order.vehiclePlate,
      customer: order.customerName,
      date: order.entryDate,
      route: [origin, destination].filter(Boolean).join(' → '),
      revenue,
      costs: sum(tripExpenses),
      km: truckKm ?? routeKm,
      kmSource: truckKm !== null ? 'truck' : routeKm !== null ? 'route' : null,
      expenses: tripExpenses,
      orderExists: true,
    };
  });

  // Lançamentos de OS que não vieram na lista: viram uma viagem só com os dados do lançamento.
  for (const [orderId, list] of byOrder) {
    trips.push({
      id: orderId,
      number: list[0].serviceOrderNumber ?? 'OS',
      plate: list[0].vehiclePlate ?? '',
      customer: '',
      date: null,
      route: '',
      revenue: null,
      costs: sum(list),
      km: null,
      kmSource: null,
      expenses: list,
      orderExists: false,
    });
  }

  const term = search.trim().toLowerCase();
  const matches = (...fields: (string | null | undefined)[]) =>
    !term || fields.some((field) => field?.toLowerCase().includes(term));

  const selected = trips
    .filter((trip) => inRange(trip.date) || trip.expenses.some((e) => inRange(e.createdAt)))
    .filter((trip) => matches(trip.number, trip.plate, trip.customer))
    .sort((a, b) => (b.date ?? b.expenses[0]?.createdAt ?? '').localeCompare(a.date ?? a.expenses[0]?.createdAt ?? ''));

  const looseExpenses = looseAll
    .filter((e) => inRange(e.createdAt))
    .filter((e) => matches(e.category, e.description));

  const counted = [...selected.flatMap((trip) => trip.expenses), ...looseExpenses];
  const categories = new Map<string, number>();
  for (const expense of counted) categories.set(expense.category, (categories.get(expense.category) ?? 0) + expense.amount);

  return {
    trips: selected,
    looseExpenses,
    totalCosts: sum(counted),
    totalRevenue: Math.round(selected.reduce((total, trip) => total + (trip.revenue ?? 0), 0) * 100) / 100,
    byCategory: [...categories]
      .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total),
  };
}
