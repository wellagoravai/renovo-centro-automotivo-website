import { normalizeDocument, validateCpfOrCnpj } from './helpers';

describe('document validation helpers', () => {
  it('normalizes numbers from CPF and CNPJ strings', () => {
    expect(normalizeDocument('123.456.789-09')).toBe('12345678909');
    expect(normalizeDocument('12.345.678/0001-99')).toBe('12345678000199');
  });

  it('accepts valid CPF and CNPJ values', () => {
    expect(validateCpfOrCnpj('529.982.247-25')).toBe(true);
    expect(validateCpfOrCnpj('11.222.333/0001-81')).toBe(true);
  });

  it('rejects missing or invalid documents', () => {
    expect(validateCpfOrCnpj('')).toBe(false);
    expect(validateCpfOrCnpj('111.111.111-11')).toBe(false);
    expect(validateCpfOrCnpj('99.999.999/9999-99')).toBe(false);
  });
});
