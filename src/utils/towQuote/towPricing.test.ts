import { calculateTowPrice } from './towPricing';

const noTolls = { tollsBase: 0, tollsMargin: 0, tollsValue: 0 };

describe('calculateTowPrice', () => {
  it('cobra saída + km excedente acima do raio (exemplo da OS ACPP)', () => {
    const price = calculateTowPrice({ departureValue: 180, radiusKm: 40, totalKm: 284, pricePerKm: 3.5 });

    expect(price).toEqual({ excessKm: 244, excessValue: 854, ...noTolls, total: 1034, complete: true });
  });

  it('dentro do raio cobra só a saída', () => {
    const price = calculateTowPrice({ departureValue: 180, radiusKm: 40, totalKm: 35, pricePerKm: 3.5 });

    expect(price).toEqual({ excessKm: 0, excessValue: 0, ...noTolls, total: 180, complete: true });
  });

  it('sem KM total ou sem preço por km fica incompleto e o total é só a saída', () => {
    expect(calculateTowPrice({ departureValue: 180, radiusKm: 40, totalKm: null, pricePerKm: 3.5 }).complete).toBe(false);
    expect(calculateTowPrice({ departureValue: 180, radiusKm: 40, totalKm: 284, pricePerKm: null })).toEqual({
      excessKm: 0,
      excessValue: 0,
      ...noTolls,
      total: 180,
      complete: false,
    });
  });

  it('soma os pedágios ao total com 5% de reserva para reajustes', () => {
    const price = calculateTowPrice({ departureValue: 180, radiusKm: 40, totalKm: 284, pricePerKm: 3.5, tollsValue: 42.6 });

    expect(price).toEqual({
      excessKm: 244,
      excessValue: 854,
      tollsBase: 42.6,
      tollsMargin: 2.13,
      tollsValue: 44.73,
      total: 1078.73,
      complete: true,
    });
    expect(calculateTowPrice({ departureValue: 180, radiusKm: 40, totalKm: null, pricePerKm: 3.5, tollsValue: 20 }).total).toBe(201);
  });

  it('arredonda centavos', () => {
    const price = calculateTowPrice({ departureValue: 180, radiusKm: 40, totalKm: 41.3, pricePerKm: 3.33 });

    expect(price.excessValue).toBe(4.33);
    expect(price.total).toBe(184.33);
  });
});
