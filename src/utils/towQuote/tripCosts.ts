export const TRIP_COSTS_PATH = '/custos-viagem';

// Mesmas categorias de TripExpenseCategories no backend.
export const TRIP_COST_CATEGORIES: { value: string; icon: string }[] = [
  { value: 'Abastecimento', icon: '⛽' },
  { value: 'Pedágio', icon: '🛣️' },
  { value: 'Pernoite', icon: '🛏️' },
  { value: 'Manutenção imprevisto', icon: '🔧' },
  { value: 'Alimentação', icon: '🍽️' },
  { value: 'Comissão motorista', icon: '💵' },
];

export const tripCostIcon = (category: string) => TRIP_COST_CATEGORIES.find((c) => c.value === category)?.icon ?? '💲';
