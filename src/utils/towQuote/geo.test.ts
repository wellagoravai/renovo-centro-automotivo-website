import { formatLatLng, parseLatLng } from './geo';

describe('parseLatLng', () => {
  it('lê coordenadas decimais', () => {
    expect(parseLatLng('-21.123456, -50.654321')).toEqual({ lat: -21.123456, lng: -50.654321 });
    expect(parseLatLng(' -21.1,-50.2 ')).toEqual({ lat: -21.1, lng: -50.2 });
  });

  it('lê links do Google Maps', () => {
    expect(parseLatLng('https://maps.google.com/?q=-21.1234,-50.4321')).toEqual({ lat: -21.1234, lng: -50.4321 });
    expect(parseLatLng('https://maps.google.com/maps?q=-21.1234%2C-50.4321')).toEqual({ lat: -21.1234, lng: -50.4321 });
    expect(parseLatLng('https://www.google.com/maps/@-21.1234,-50.4321,17z')).toEqual({ lat: -21.1234, lng: -50.4321 });
  });

  it('recusa texto sem coordenadas ou fora da faixa', () => {
    expect(parseLatLng('')).toBeNull();
    expect(parseLatLng('Fazenda Boa Vista')).toBeNull();
    expect(parseLatLng('https://maps.app.goo.gl/abc123')).toBeNull();
    expect(parseLatLng('95.0, -50.0')).toBeNull();
  });

  it('formata com 6 casas para a rota', () => {
    expect(formatLatLng({ lat: -21.1, lng: -50.2 })).toBe('-21.100000,-50.200000');
  });
});
