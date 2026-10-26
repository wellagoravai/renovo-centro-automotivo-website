import type { ServiceOrder, TripExpense } from './types';
import { buildTripReport } from './tripReport';

const now = new Date(2026, 9, 15, 12); // 15/10/2026

const order = (id: string, entryDate: string, towDetails: Partial<ServiceOrder['towDetails']> = {}): ServiceOrder =>
  ({
    id,
    number: `OS-${id}`,
    vehiclePlate: `ABC-${id}`,
    customerName: `Cliente ${id}`,
    entryDate,
    value: 0,
    towDetails: { originCity: 'Andradina', originState: 'SP', destinationCity: 'Birigui', destinationState: 'SP', ...towDetails },
  }) as ServiceOrder;

const expense = (id: string, amount: number, createdAt: string, serviceOrderId: string | null, category = 'Pedágio'): TripExpense => ({
  id,
  category,
  amount,
  description: '',
  createdAt,
  createdBy: 'Fulano',
  serviceOrderId,
  serviceOrderNumber: serviceOrderId ? `OS-${serviceOrderId}` : null,
  vehiclePlate: null,
});

describe('buildTripReport', () => {
  it('soma os custos de cada viagem e calcula o resultado com o frete cobrado', () => {
    const report = buildTripReport(
      [order('1', '2026-10-05T10:00:00', { freightTotal: 1000, truckStartKm: 1000, truckEndKm: 1250 })],
      [expense('a', 300, '2026-10-05T12:00:00', '1', 'Abastecimento'), expense('b', 45.5, '2026-10-05T13:00:00', '1')],
      'month',
      '',
      now
    );

    expect(report.trips).toHaveLength(1);
    expect(report.trips[0]).toMatchObject({ costs: 345.5, revenue: 1000, km: 250, kmSource: 'truck', route: 'Andradina/SP → Birigui/SP' });
    expect(report.totalCosts).toBe(345.5);
    expect(report.totalRevenue).toBe(1000);
    expect(report.byCategory).toEqual([
      { category: 'Abastecimento', total: 300 },
      { category: 'Pedágio', total: 45.5 },
    ]);
  });

  it('filtra pelo período (data da OS ou de algum custo) e usa a distância da rota sem hodômetro', () => {
    const orders = [order('1', '2026-10-02T10:00:00', { distanceKm: 180 }), order('2', '2026-08-01T10:00:00')];
    const expenses = [expense('a', 50, '2026-09-30T10:00:00', '1'), expense('b', 20, '2026-08-01T10:00:00', '2')];

    const thisMonth = buildTripReport(orders, expenses, 'month', '', now);
    expect(thisMonth.trips.map((t) => t.id)).toEqual(['1']);
    // A viagem entra pelo mês da OS, mas o custo lançado no fim do mês anterior também conta.
    expect(thisMonth.trips[0]).toMatchObject({ costs: 50, km: 180, kmSource: 'route' });

    expect(buildTripReport(orders, expenses, 'all', '', now).trips.map((t) => t.id)).toEqual(['1', '2']);
  });

  it('separa os avulsos, inclui OS fora da lista e busca por placa/cliente', () => {
    const report = buildTripReport(
      [order('1', '2026-10-02T10:00:00')],
      [expense('a', 10, '2026-10-03T10:00:00', null, 'Alimentação'), expense('b', 30, '2026-10-04T10:00:00', '9')],
      'month',
      '',
      now
    );

    expect(report.looseExpenses.map((e) => e.id)).toEqual(['a']);
    expect(report.trips.find((t) => t.id === '9')).toMatchObject({ number: 'OS-9', orderExists: false, costs: 30 });
    expect(report.totalCosts).toBe(40);

    expect(buildTripReport([order('1', '2026-10-02T10:00:00')], [], 'month', 'cliente 1', now).trips).toHaveLength(1);
    expect(buildTripReport([order('1', '2026-10-02T10:00:00')], [], 'month', 'xyz', now).trips).toHaveLength(0);
  });
});
