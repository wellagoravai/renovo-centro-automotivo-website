import { calculateForkliftPrice, describeQuantity } from './forkliftPricing';

const base = { quantity: null, unitValue: null, palletCount: null, pricePerPallet: null, transportValue: null };

describe('calculateForkliftPrice', () => {
  it('multiplica quantidade pelo valor unitário na hora/diária/mês', () => {
    const price = calculateForkliftPrice({ ...base, mode: 'Hora', quantity: 8, unitValue: 150 });
    expect(price).toMatchObject({ quantity: 8, rentalValue: 1200, total: 1200, complete: true });
  });

  it('no contrato por período o valor digitado já é o total', () => {
    const price = calculateForkliftPrice({ ...base, mode: 'Período', quantity: 30, unitValue: 9500 });
    expect(price).toMatchObject({ quantity: 1, rentalValue: 9500, total: 9500, complete: true });
  });

  it('soma paletes (quando há valor por palete) e transporte', () => {
    const price = calculateForkliftPrice({
      mode: 'Diária', quantity: 2, unitValue: 800, palletCount: 40, pricePerPallet: 2.5, transportValue: 350,
    });
    expect(price).toMatchObject({ rentalValue: 1600, palletsValue: 100, transportValue: 350, total: 2050 });
  });

  it('paletes sem valor por palete não entram no total', () => {
    const price = calculateForkliftPrice({ ...base, mode: 'Mensal', quantity: 1, unitValue: 7000, palletCount: 120 });
    expect(price.palletsValue).toBe(0);
    expect(price.total).toBe(7000);
  });

  it('fica incompleto sem quantidade ou valor, ignorando negativos', () => {
    expect(calculateForkliftPrice({ ...base, mode: 'Hora', unitValue: 150 }).complete).toBe(false);
    expect(calculateForkliftPrice({ ...base, mode: 'Hora', quantity: -3, unitValue: 150 }).total).toBe(0);
  });
});

describe('describeQuantity', () => {
  it('usa singular e plural da modalidade', () => {
    expect(describeQuantity('Hora', 1)).toBe('1 hora');
    expect(describeQuantity('Mensal', 3)).toBe('3 meses');
    expect(describeQuantity('Diária', 1.5)).toBe('1,5 diárias');
  });
});
