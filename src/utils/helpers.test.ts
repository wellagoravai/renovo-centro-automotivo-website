import { formatCpfCnpj, formatPlate, validateCpfOrCnpj } from './helpers';

describe('formatCpfCnpj', () => {
  it('formata CPF enquanto digita', () => {
    expect(formatCpfCnpj('529')).toBe('529');
    expect(formatCpfCnpj('5299')).toBe('529.9');
    expect(formatCpfCnpj('5299822')).toBe('529.982.2');
    expect(formatCpfCnpj('52998224725')).toBe('529.982.247-25');
  });

  it('vira CNPJ acima de 11 dígitos', () => {
    expect(formatCpfCnpj('686998530001')).toBe('68.699.853/0001');
    expect(formatCpfCnpj('68699853000105')).toBe('68.699.853/0001-05');
  });

  it('ignora pontuação colada e limita a 14 caracteres', () => {
    expect(formatCpfCnpj('68.699.853/0001-05999')).toBe('68.699.853/0001-05');
    expect(formatCpfCnpj('!@#')).toBe('');
  });

  it('aceita CNPJ alfanumérico, com verificadores só numéricos', () => {
    expect(formatCpfCnpj('12abc')).toBe('12.ABC');
    expect(formatCpfCnpj('12ABC34501DE35')).toBe('12.ABC.345/01DE-35');
    expect(formatCpfCnpj('12ABC34501DEXY')).toBe('12.ABC.345/01DE');
  });
});

describe('validateCpfOrCnpj', () => {
  it('valida CPF, CNPJ numérico e CNPJ alfanumérico', () => {
    expect(validateCpfOrCnpj('529.982.247-25')).toBe(true);
    expect(validateCpfOrCnpj('68.699.853/0001-05')).toBe(true);
    expect(validateCpfOrCnpj('12.ABC.345/01DE-35')).toBe(true);
    expect(validateCpfOrCnpj('12.abc.345/01de-35')).toBe(true);
  });

  it('recusa verificador errado e CPF com letra', () => {
    expect(validateCpfOrCnpj('12.ABC.345/01DE-36')).toBe(false);
    expect(validateCpfOrCnpj('529.98A.247-25')).toBe(false);
  });
});

describe('formatPlate', () => {
  it('deixa a placa em maiúsculas com traço', () => {
    expect(formatPlate('dre4d40')).toBe('DRE-4D40');
    expect(formatPlate('abc-1234')).toBe('ABC-1234');
    expect(formatPlate('ab')).toBe('AB');
  });
});
