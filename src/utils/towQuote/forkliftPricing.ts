// Locação de empilhadeira: por hora, diária, mês ou contrato por período, com
// valores digitados à mão (ainda não há tabela de preços). Na hora/diária/mês o
// valor da locação é quantidade x valor unitário; no contrato por período o valor
// digitado já é o total do contrato. Movimentação de paletes (quando cobrada por
// palete) e o transporte da empilhadeira pelo guincho somam ao total.
export type ForkliftRentalMode = 'Hora' | 'Diária' | 'Mensal' | 'Período';

export const FORKLIFT_RENTAL_MODES: { value: ForkliftRentalMode; label: string; unit: string; unitPlural: string }[] = [
  { value: 'Hora', label: 'Por hora', unit: 'hora', unitPlural: 'horas' },
  { value: 'Diária', label: 'Diária', unit: 'diária', unitPlural: 'diárias' },
  { value: 'Mensal', label: 'Mensal', unit: 'mês', unitPlural: 'meses' },
  { value: 'Período', label: 'Contrato por período', unit: 'contrato', unitPlural: 'contratos' },
];

export interface ForkliftPriceInput {
  mode: ForkliftRentalMode;
  quantity: number | null;
  unitValue: number | null;
  palletCount: number | null;
  pricePerPallet: number | null;
  transportValue: number | null;
}

export interface ForkliftPrice {
  // Quantidade efetivamente cobrada (1 no contrato por período).
  quantity: number;
  rentalValue: number;
  palletsValue: number;
  transportValue: number;
  total: number;
  // false quando falta quantidade ou valor da locação.
  complete: boolean;
}

const round2 = (value: number) => Math.round(value * 100) / 100;
const positive = (value: number | null) => (value !== null && Number.isFinite(value) && value > 0 ? value : 0);

export function calculateForkliftPrice(input: ForkliftPriceInput): ForkliftPrice {
  const quantity = input.mode === 'Período' ? 1 : positive(input.quantity);
  const unitValue = positive(input.unitValue);
  const rentalValue = round2(quantity * unitValue);
  const palletsValue = round2(positive(input.palletCount) * positive(input.pricePerPallet));
  const transportValue = round2(positive(input.transportValue));
  return {
    quantity,
    rentalValue,
    palletsValue,
    transportValue,
    total: round2(rentalValue + palletsValue + transportValue),
    complete: quantity > 0 && unitValue > 0,
  };
}

export const rentalModeInfo = (mode: ForkliftRentalMode) =>
  FORKLIFT_RENTAL_MODES.find((m) => m.value === mode) ?? FORKLIFT_RENTAL_MODES[0];

// "8 horas", "1 diária", "3 meses".
export const describeQuantity = (mode: ForkliftRentalMode, quantity: number) => {
  const info = rentalModeInfo(mode);
  return `${quantity.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${quantity === 1 ? info.unit : info.unitPlural}`;
};
