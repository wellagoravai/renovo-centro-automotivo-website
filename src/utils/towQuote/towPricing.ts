// Regra de preço do guincho: a saída cobre até `radiusKm` rodados; o que passar
// disso é cobrado por km. Ex.: saída R$ 180 (até 40 km) + (284 - 40) x R$ 3,50 = R$ 1.034.
// Pedágios (quando houver) somam ao total, sempre com TOLL_MARGIN de reserva
// para reajustes de tarifa não previstos.
export const TOLL_MARGIN = 0.05;

export interface TowPriceInput {
  departureValue: number;
  radiusKm: number;
  totalKm: number | null;
  pricePerKm: number | null;
  tollsValue?: number | null;
}

export interface TowPrice {
  excessKm: number;
  excessValue: number;
  // Pedágio informado/calculado, a reserva de TOLL_MARGIN e a soma dos dois (o que entra no total).
  tollsBase: number;
  tollsMargin: number;
  tollsValue: number;
  total: number;
  // false quando falta KM total ou preço por km: o excedente fica "a consultar".
  complete: boolean;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

export function calculateTowPrice({ departureValue, radiusKm, totalKm, pricePerKm, tollsValue }: TowPriceInput): TowPrice {
  const departure = Math.max(0, departureValue || 0);
  const tollsBase = round2(Math.max(0, tollsValue || 0));
  const tollsMargin = round2(tollsBase * TOLL_MARGIN);
  const tolls = { tollsBase, tollsMargin, tollsValue: round2(tollsBase + tollsMargin) };
  if (totalKm === null || totalKm < 0 || !pricePerKm || pricePerKm <= 0) {
    return { excessKm: 0, excessValue: 0, ...tolls, total: round2(departure + tolls.tollsValue), complete: false };
  }

  const excessKm = Math.max(0, totalKm - radiusKm);
  const excessValue = round2(excessKm * pricePerKm);
  return { excessKm, excessValue, ...tolls, total: round2(departure + excessValue + tolls.tollsValue), complete: true };
}
